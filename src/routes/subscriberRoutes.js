const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const Campaign = require('../models/Campaign');
const Subscriber = require('../models/Subscriber');

// Anti-spam: Track unique views per IP per campaign (10 min window)
const viewTracker = new Map();

// POST /api/subscribers/subscribe/:shareToken (Public)
router.post('/subscribe/:shareToken', async (req, res) => {
  try {
    const { shareToken } = req.params;
    const { name, email, phone, company, location } = req.body;
    if (!name || !email) return res.status(400).json({ success: false, error: 'Name and email are required' });
    const campaign = await Campaign.findOne({ shareToken });
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
    const existing = await Subscriber.findOne({ campaignId: campaign._id, email });
    if (existing) return res.status(400).json({ success: false, error: 'Already subscribed' });
    const subscriber = await Subscriber.create({ campaignId: campaign._id, name, email, phone: phone || null, location: location || null, company: company || null, source: 'share_link', status: 'confirmed' });
    await Campaign.findByIdAndUpdate(campaign._id, { $inc: { subscriberCount: 1 } });
    res.status(201).json({ success: true, message: 'Subscribed!', subscriber: { id: subscriber._id, name, email } });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// POST /api/subscribers/add (Public - from landing page)
router.post('/add', async (req, res) => {
  try {
    const { name, email, phone, company, location, campaignId, userId } = req.body;
    if (!name || !email || !phone) return res.status(400).json({ success: false, message: 'Name, email, and phone required' });
    console.log(`📬 New subscriber: ${name} (${email})`);
    res.json({ success: true, message: 'Subscribed successfully!' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// GET public campaign with smart view counting
router.get('/campaign/:shareToken', async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ shareToken: req.params.shareToken }).populate('createdBy', 'name email');
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
    
    // Smart view counting: 1 view per IP per campaign per 10 minutes
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const key = `${ip}_${campaign._id}`;
    const now = Date.now();
    const lastView = viewTracker.get(key);
    
    if (!lastView || (now - lastView) > 600000) { // 10 minutes
      await Campaign.findByIdAndUpdate(campaign._id, { $inc: { viewCount: 1 } });
      viewTracker.set(key, now);
      campaign.viewCount += 1;
    }
    
    // Clean old entries every 100 views
    if (viewTracker.size > 1000) {
      const cutoff = now - 600000;
      for (const [k, v] of viewTracker) {
        if (v < cutoff) viewTracker.delete(k);
      }
    }
    
    res.json({ 
      success: true, 
      campaign: { 
        id: campaign._id, 
        name: campaign.name, 
        subject: campaign.subject, 
        content: campaign.content, 
        createdBy: campaign.createdBy || { name: 'EmailAI User' },
        subscriberCount: campaign.subscriberCount, 
        viewCount: campaign.viewCount 
      } 
    });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// GET subscribers (Auth) - MUST be after /campaign/:shareToken
router.get('/campaign/:campaignId/subscribers', authMiddleware, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.campaignId, createdBy: req.user._id });
    if (!campaign) return res.status(404).json({ success: false, error: 'Not found' });
    const subscribers = await Subscriber.find({ campaignId: req.params.campaignId }).sort({ subscribedAt: -1 });
    res.json({ success: true, subscribers, total: subscribers.length });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// DELETE subscriber (Auth)
router.delete('/:subscriberId', authMiddleware, async (req, res) => {
  try {
    const subscriber = await Subscriber.findById(req.params.subscriberId);
    if (!subscriber) return res.status(404).json({ success: false, error: 'Not found' });
    await Campaign.findByIdAndUpdate(subscriber.campaignId, { $inc: { subscriberCount: -1 } });
    await Subscriber.findByIdAndDelete(req.params.subscriberId);
    res.json({ success: true, message: 'Removed' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

module.exports = router;