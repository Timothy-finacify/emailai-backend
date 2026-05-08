const express = require('express');
const router = express.Router();
const BriefPerformanceTracker = require('../services/briefPerformanceTracker');

// Store tracking data temporarily (upgrade to MongoDB later)
const trackingStore = new Map();

// Tracking pixel - records email opens
router.get('/open/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params;
    
    if (trackingStore.has(trackingId)) {
      const data = trackingStore.get(trackingId);
      data.opens = (data.opens || 0) + 1;
      data.lastOpened = new Date();
      trackingStore.set(trackingId, data);
      
      // ✅ Update BriefPerformanceTracker with real data
      if (data.userId && data.brief) {
        const BriefPerformanceTracker = require('../services/briefPerformanceTracker');
        BriefPerformanceTracker.trackPerformance(
          data.userId,
          data.brief,
          { openRate: data.opens / (data.totalSent || 1), clickRate: (data.clicks || 0) / (data.totalSent || 1), conversionRate: 0 }
        );
      }
      
      console.log(`📬 Email opened: ${trackingId} (${data.opens} opens)`);
    }
    
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, { 'Content-Type': 'image/gif', 'Content-Length': pixel.length, 'Cache-Control': 'no-cache' });
    res.end(pixel);
  } catch (error) { res.status(500).end(); }
});
// Click tracking
router.get('/click/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params;
    const redirectUrl = req.query.url || '/';
    
    if (trackingStore.has(trackingId)) {
      const data = trackingStore.get(trackingId);
      data.clicks = (data.clicks || 0) + 1;
      data.lastClicked = new Date();
      trackingStore.set(trackingId, data);
      
      console.log(`👆 Email clicked: ${trackingId} (${data.clicks} clicks)`);
    }
    
    res.redirect(redirectUrl);
  } catch (error) {
    res.redirect('/');
  }
});

// Get tracking stats
router.get('/stats/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params;
    const data = trackingStore.get(trackingId) || { opens: 0, clicks: 0 };
    res.json({ success: true, tracking: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
  // Get tracking stats for dashboard
router.get('/stats', async (req, res) => {
  try {
    let totalOpens = 0;
    let totalClicks = 0;
    let totalSent = 0;
    
    for (const [id, data] of trackingStore.entries()) {
      totalOpens += data.opens || 0;
      totalClicks += data.clicks || 0;
      totalSent += 1;
    }
    
    res.json({
      success: true,
      stats: {
        totalEmailsSent: totalSent,
        totalOpens: totalOpens,
        totalClicks: totalClicks,
        openRate: totalSent > 0 ? Math.round((totalOpens / totalSent) * 100) : 0,
        clickRate: totalSent > 0 ? Math.round((totalClicks / totalSent) * 100) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
// Record campaign send (called when email is actually sent)
router.post('/record-send', async (req, res) => {
  try {
    const { trackingId, campaignId, userId, brief, senderName, senderCompany } = req.body;
    
    trackingStore.set(trackingId, {
      campaignId, userId, brief,
      senderName, senderCompany,
      opens: 0, clicks: 0, totalSent: 1,
      sentAt: new Date()
    });
    
    console.log(`📤 Campaign recorded: ${trackingId}`);
    res.json({ success: true, trackingId });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// Update BriefPerformanceTracker when campaign completes
router.post('/update-learning', async (req, res) => {
  try {
    const { trackingId, userId } = req.body;
    const trackingData = trackingStore.get(trackingId);
    
    if (trackingData && trackingData.brief) {
      const totalSent = trackingData.totalSent || 1;
      const campaignResult = {
        openRate: trackingData.opens / totalSent,
        clickRate: trackingData.clicks / totalSent,
        conversionRate: 0
      };
      
      BriefPerformanceTracker.trackPerformance(
        userId,
        trackingData.brief,
        campaignResult
      );
      
      console.log(`📊 Learning updated from tracking: ${trackingId}`);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
module.exports.trackingStore = trackingStore;