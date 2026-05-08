const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const Campaign = require('../models/Campaign');
const User = require('../models/User');

const AnalyticsEvent = require('../models/AnalyticsEvent');

// GET /api/enterprise/analytics/dashboard — REAL
router.get('/analytics/dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const range = req.query.range || '7d';
    const now = new Date();
    const startDate = new Date();
    if (range === '30d') startDate.setDate(now.getDate() - 30);
    else if (range === '90d') startDate.setDate(now.getDate() - 90);
    else startDate.setDate(now.getDate() - 7);

    const campaigns = await Campaign.find({ userId });
    const totalViews = await AnalyticsEvent.countDocuments({ userId, type: 'view', date: { $gte: startDate } });
    const totalSubscribers = await AnalyticsEvent.countDocuments({ userId, type: 'subscriber', date: { $gte: startDate } });
    const conversionRate = totalViews > 0 ? ((totalSubscribers / totalViews) * 100).toFixed(1) : '0';
    const activeCampaigns = campaigns.filter(c => c.status === 'sent' || c.status === 'active').length;

    const days = range === '90d' ? 90 : range === '30d' ? 30 : 7;
    const viewsOverTime = [];
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(now.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      const dayViews = await AnalyticsEvent.countDocuments({ userId, type: 'view', date: { $gte: dayStart, $lte: dayEnd } });
      viewsOverTime.push({ date: dayStart.toLocaleDateString('en-US', { weekday: 'short' }), views: dayViews });
    }

    res.json({ success: true, data: { totalViews, totalSubscribers, conversionRate, activeCampaigns, totalCampaigns: campaigns.length, viewsOverTime } });
  } catch (err) {
    res.json({ success: true, data: { totalViews: 0, totalSubscribers: 0, conversionRate: '0', activeCampaigns: 0, totalCampaigns: 0, viewsOverTime: [] } });
  }
});

// GET /api/enterprise/analytics/export — REAL CSV DOWNLOAD
router.get('/analytics/export', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const campaigns = await Campaign.find({ userId });
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const rows = [];
    
    for (const c of campaigns) {
      const views = await AnalyticsEvent.countDocuments({ campaignId: c._id, type: 'view', date: { $gte: startDate } });
      const subscribers = await AnalyticsEvent.countDocuments({ campaignId: c._id, type: 'subscriber', date: { $gte: startDate } });
      rows.push({
        name: c.name || 'Untitled',
        subject: c.subject || '',
        views,
        subscribers,
        conversion: views > 0 ? ((subscribers / views) * 100).toFixed(1) + '%' : '0%',
        status: c.status || 'draft',
        created: new Date(c.createdAt).toLocaleDateString()
      });
    }

    // Build CSV
    const headers = ['Campaign Name', 'Subject', 'Views', 'Subscribers', 'Conversion', 'Status', 'Created'];
    let csv = headers.join(',') + '\n';
    
    rows.forEach(row => {
      csv += `"${row.name}","${row.subject}",${row.views},${row.subscribers},"${row.conversion}","${row.status}","${row.created}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-export-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// GET /api/enterprise/sso/settings
router.get('/sso/settings', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    res.json({
      success: true,
      settings: {
        samlEnabled: user?.samlEnabled || false,
        twoFactorEnforced: user?.twoFactorEnforced || false,
        auditLogsEnabled: user?.auditLogsEnabled !== false,
        sessionTimeout: user?.sessionTimeout || 30
      }
    });
  } catch (err) {
    res.json({ success: true, settings: { samlEnabled: false, twoFactorEnforced: false, auditLogsEnabled: true, sessionTimeout: 30 } });
  }
});

// PUT /api/enterprise/sso/settings
router.put('/sso/settings', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    await User.findByIdAndUpdate(userId, { $set: req.body });
    res.json({ success: true, message: 'Settings updated', settings: req.body });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

const AuditLog = require('../models/AuditLog');

// GET /api/enterprise/sso/audit-logs — REAL DATA
router.get('/sso/audit-logs', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const logs = await AuditLog.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .select('action email ipAddress userAgent method endpoint statusCode responseTime details createdAt');

    res.json({ success: true, logs });
  } catch (err) {
    console.error('Audit logs error:', err);
    res.json({ success: true, logs: [] });
  }
});
module.exports = router;