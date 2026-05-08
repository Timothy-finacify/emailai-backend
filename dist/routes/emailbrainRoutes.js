// backend/src/routes/emailbrainRoutes.js
const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { handleAnalyzeBrief } = require('../emailbrain/api/analyze-brief');
const BriefPerformanceTracker = require('../services/briefPerformanceTracker');
const router = express.Router();
router.post('/track-performance', authMiddleware, async (req, res) => {
    try {
        const { brief, performance } = req.body;
        const userId = req.user.id;
        BriefPerformanceTracker.trackPerformance(userId, brief, performance);
        res.json({
            success: true,
            message: 'Performance tracked successfully'
        });
    }
    catch (error) {
        console.error('❌ Track performance error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Add stats endpoint
router.get('/stats', authMiddleware, (req, res) => {
    try {
        const stats = BriefPerformanceTracker.getAllStats();
        res.json({ success: true, stats });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/emailbrain/analyze-brief
 * Analyze campaign brief and return ML-powered suggestions
 */
router.post('/analyze-brief', authMiddleware, handleAnalyzeBrief);
/**
 * GET /api/emailbrain/health
 * Simple health check for EmailBrain routes
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'EmailBrain routes are operational',
        timestamp: new Date().toISOString()
    });
});
module.exports = router;
//# sourceMappingURL=emailbrainRoutes.js.map