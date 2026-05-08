"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const BehavioralProfileManager_1 = require("../emailbrain/managers/BehavioralProfileManager");
const CampaignRecord_1 = require("../models/CampaignRecord");
const BehavioralProfile_1 = require("../models/BehavioralProfile");
const auth_1 = require("../middleware/auth");
const express_rate_limit_1 = require("express-rate-limit");
const router = express_1.default.Router();
// Rate limiting: 100 requests per minute per user
const feedbackRateLimit = (0, express_rate_limit_1.rateLimit)({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: { error: "Too many feedback requests, please try again later" },
    keyGenerator: (req) => req.user?.id || req.ip, // Rate limit by user ID or IP
    standardHeaders: true,
    legacyHeaders: false,
});
// Retry helper function
async function withRetry(fn, maxRetries = 3, delay = 1000) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (i === maxRetries - 1)
                throw lastError;
            await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i))); // Exponential backoff
        }
    }
    throw lastError;
}
router.post('/api/v1/learning/feedback', auth_1.authenticateUser, // Authentication required
feedbackRateLimit, // Rate limiting
async (req, res) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { emailId, actual_stats } = req.body;
        // ===== VALIDATION =====
        if (!emailId || !actual_stats) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                error: "Missing required fields",
                required: ["emailId", "actual_stats.open_rate", "actual_stats.click_rate", "actual_stats.conversion_rate"]
            });
        }
        // Validate required stats fields
        const requiredStats = ['open_rate', 'click_rate', 'conversion_rate', 'sent_to', 'opens', 'clicks', 'conversions'];
        const missingStats = requiredStats.filter(field => !actual_stats[field]);
        if (missingStats.length > 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                error: "Missing statistics fields",
                missing: missingStats
            });
        }
        // ===== FETCH WITH RETRY LOGIC =====
        const existingRecord = await withRetry(async () => {
            return await CampaignRecord_1.CampaignRecord.findOne({ emailId }).session(session);
        });
        if (!existingRecord) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ error: "Campaign not found" });
        }
        // Idempotency check
        if (existingRecord.status === 'processed') {
            await session.abortTransaction();
            session.endSession();
            return res.status(409).json({
                error: "Campaign already processed",
                processedAt: existingRecord.processedAt,
                emailId: emailId
            });
        }
        // Check if campaign belongs to authenticated user
        if (existingRecord.userId !== req.user.id) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ error: "Unauthorized access to this campaign" });
        }
        // Fetch profile
        const profile = await withRetry(async () => {
            return await BehavioralProfile_1.BehavioralProfileModel.findOne({
                niche_id: existingRecord.nicheId
            }).session(session);
        });
        if (!profile) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
                error: "Behavioral profile not found",
                niche_id: existingRecord.nicheId
            });
        }
        // ===== CONSTRUCT FEEDBACK =====
        const feedback = {
            ...existingRecord.metadata,
            actual_open_rate: actual_stats.open_rate,
            actual_click_rate: actual_stats.click_rate,
            actual_conversion_rate: actual_stats.conversion_rate,
            sent_to: actual_stats.sent_to,
            opens: actual_stats.opens,
            clicks: actual_stats.clicks,
            conversions: actual_stats.conversions,
            persona: existingRecord.persona,
            stage: existingRecord.stage,
            processed_at: new Date(),
            processed_by: req.user.id
        };
        // ===== PROCESS WITH RETRY =====
        const updatedProfile = await withRetry(async () => {
            return await BehavioralProfileManager_1.BehavioralProfileManager.processCampaignFeedback(feedback, profile);
        });
        // ===== ATOMIC UPDATE WITH TRANSACTION =====
        const updateTimestamp = new Date();
        const [profileUpdate, campaignUpdate] = await Promise.all([
            BehavioralProfile_1.BehavioralProfileModel.updateOne({ niche_id: existingRecord.nicheId }, {
                ...updatedProfile,
                last_updated: updateTimestamp,
                last_updated_by: req.user.id
            }).session(session),
            CampaignRecord_1.CampaignRecord.updateOne({ emailId }, {
                status: 'processed',
                processedAt: updateTimestamp,
                actual_stats: actual_stats,
                processed_by: req.user.id
            }).session(session)
        ]);
        // Verify updates succeeded
        if (profileUpdate.modifiedCount === 0) {
            throw new Error("Failed to update behavioral profile");
        }
        if (campaignUpdate.modifiedCount === 0) {
            throw new Error("Failed to update campaign record");
        }
        // ===== COMMIT TRANSACTION =====
        await session.commitTransaction();
        session.endSession();
        // ===== SUCCESS RESPONSE =====
        res.json({
            message: "Niche profile updated with new intelligence",
            data: {
                emailId: emailId,
                niche_id: existingRecord.nicheId,
                processed_at: updateTimestamp,
                improvements: {
                    open_rate_delta: actual_stats.open_rate - (existingRecord.metadata?.predicted_open_rate || 0),
                    click_rate_delta: actual_stats.click_rate - (existingRecord.metadata?.predicted_click_rate || 0)
                }
            }
        });
    }
    catch (error) {
        // ===== ERROR HANDLING =====
        await session.abortTransaction();
        session.endSession();
        console.error('Feedback processing error:', {
            error: error.message,
            stack: error.stack,
            body: req.body,
            userId: req.user?.id,
            timestamp: new Date().toISOString()
        });
        // Determine appropriate status code
        let statusCode = 500;
        let errorMessage = "Internal server error";
        if (error.message.includes('validation') || error.message.includes('Validation')) {
            statusCode = 400;
            errorMessage = "Validation error in feedback data";
        }
        else if (error.message.includes('timeout') || error.message.includes('connection')) {
            statusCode = 503;
            errorMessage = "Service temporarily unavailable, please retry";
        }
        else if (error.message.includes('rate limit')) {
            statusCode = 429;
            errorMessage = "Rate limit exceeded";
        }
        res.status(statusCode).json({
            error: errorMessage,
            reference: req.id, // For logging/tracking
            retry_after: statusCode === 503 ? 5 : undefined
        });
    }
});
// Health check endpoint for monitoring
router.get('/api/v1/learning/health', auth_1.authenticateUser, async (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
exports.default = router;
//# sourceMappingURL=learning.js.map