// backend/src/routes/emailRoutes.js
const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { generateEmailWithBrain } = require('../services/emailBrainBridge');
const { handleAnalyzeBrief } = require('../emailbrain/api/analyze-brief'); // ✅ Fixed import
const router = express.Router();
/**
 * POST /api/email/generate
 * Generate AI-powered email using EmailBrain with behavioral learning
 * Protected route - requires authentication
 */
router.post('/generate', authMiddleware, async (req, res) => {
    try {
        const { subject, campaignName, nicheId, stage, persona, audience, brief } = req.body; // ✅ Added brief
        const user = req.user;
        console.log('📧 User:', user ? { email: user.email, id: user._id } : 'NO USER');
        console.log('📧 Subject:', subject);
        console.log('📧 Brief:', brief ? 'Received' : 'Not provided');
        console.log('📧 Options:', { nicheId, stage, persona });
        // Validate required fields
        if (!subject || subject.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Email subject is required'
            });
        }
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        // Build enhanced options with brief data
        const options = {
            nicheId: nicheId || "SAAS_B2B_01",
            stage: stage || "consideration",
            persona: persona || "the_pragmatist",
            audience: audience || {},
            brief: brief || null // ✅ Pass brief to generation
        };
        const result = await generateEmailWithBrain(user, subject, campaignName, options);
        res.json({
            success: true,
            draft: result.draft,
            metadata: result.metadata,
            tracking: result.tracking
        });
    }
    catch (error) {
        console.error('❌ Email generation route error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to generate email content',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
/**
 * POST /api/email/analyze-brief
 * Analyze campaign brief and return ML-powered suggestions
 * Protected route - requires authentication
 */
router.post('/analyze-brief', authMiddleware, handleAnalyzeBrief); // ✅ Fixed: use authMiddleware
/**
 * GET /api/email/niches
 * Get available niches for the current user
 */
router.get('/niches', authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const availableNiches = [
            {
                id: 'FIN_BANK_MM_001',
                name: 'First-Time Homebuyer Advisory & Lending',
                sector: 'Finance',
                description: 'Mortgage advisory and lending services'
            },
            {
                id: 'FIN_BANK_MM_002',
                name: 'Medical Professional Private Banking',
                sector: 'Finance',
                description: 'Specialized banking for medical professionals'
            },
            {
                id: 'SAAS_B2B_01',
                name: 'B2B SaaS',
                sector: 'Technology',
                description: 'Software as a Service for businesses'
            },
            {
                id: 'HLTH_FIT_01',
                name: 'Fitness & Wellness',
                sector: 'Healthcare',
                description: 'Health, fitness, and wellness services'
            }
        ];
        res.json({
            success: true,
            niches: availableNiches,
            userIndustry: user.industry
        });
    }
    catch (error) {
        console.error('❌ Get niches error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch niches'
        });
    }
});
/**
 * GET /api/email/niche/:nicheId
 * Get details and available stages/personas for a specific niche
 */
router.get('/niche/:nicheId', authMiddleware, async (req, res) => {
    try {
        const { nicheId } = req.params;
        const nicheDetails = {
            id: nicheId,
            stages: ['awareness', 'consideration', 'decision', 'retention'],
            personas: ['the_pragmatist', 'the_innovator', 'the_saver', 'the_visionary'],
            templates: ['standard', 'urgent', 'social_proof', 'scarcity']
        };
        res.json({
            success: true,
            niche: nicheDetails
        });
    }
    catch (error) {
        console.error('❌ Get niche details error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch niche details'
        });
    }
});
module.exports = router;
//# sourceMappingURL=emailRoutes.js.map