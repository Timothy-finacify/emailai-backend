 // backend/src/routes/campaignRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const Campaign = require('../models/Campaign');

// ============================================
// BASIC CRUD ROUTES
// ============================================

// GET all campaigns for logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    const campaigns = await Campaign.find({ createdBy: userId })
      .select('name subject status subscriberCount viewCount shareEnabled shareToken createdAt updatedAt')
      .sort({ updatedAt: -1 });
    
    res.json({
      success: true,
      data: campaigns,
      count: campaigns.length
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch campaigns' });
  }
});

// POST create new campaign
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { name, subject, content, status } = req.body;
    
    const campaign = await Campaign.create({
      name: name || 'Untitled Campaign',
      subject: subject || '',
      content: content || '',
      status: status || 'draft',
      createdBy: userId,
      subscriberCount: 0,
      viewCount: 0,
      shareEnabled: false
    });
    
    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ success: false, message: 'Failed to create campaign' });
  }
});

// PUT update campaign
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    const updates = req.body;
    
    const campaign = await Campaign.findOneAndUpdate(
      { _id: id, createdBy: userId },
      { ...updates, updatedAt: new Date() },
      { new: true }
    );
    
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }
    
    res.json({ success: true, data: campaign });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ success: false, message: 'Failed to update campaign' });
  }
});

// DELETE campaign
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    
    const campaign = await Campaign.findOneAndDelete({ _id: id, createdBy: userId });
    
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }
    
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete campaign' });
  }
});

// GET /api/campaigns/:id/export-count
router.get('/:id/export-count', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    
    const campaign = await Campaign.findOne({ _id: id, createdBy: userId });
    
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }
    
    res.json({
      success: true,
      data: {
        viewCount: campaign.viewCount || 0,
        subscriberCount: campaign.subscriberCount || 0,
        totalExports: 0,
        lastExported: null
      }
    });
  } catch (error) {
    console.error('Export count error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/campaigns/:id/subscribers
router.get('/:id/subscribers', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const Subscriber = require('../models/Subscriber');
    const subscribers = await Subscriber.find({ campaignId: id })
      .select('name email phone company location subscribedAt')
      .sort({ subscribedAt: -1 });
    
    res.json({
      success: true,
      data: subscribers,
      count: subscribers.length
    });
  } catch (error) {
    console.error('Get subscribers error:', error);
    res.json({ success: true, data: [], count: 0 });
  }
});

// ============================================
// SHARE ROUTES
// ============================================

// POST generate share link
router.post('/:id/share', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;
    const crypto = require('crypto');
    
    const campaign = await Campaign.findOne({ _id: id, createdBy: userId });
    
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }
    
    if (!campaign.shareToken) {
      campaign.shareToken = crypto.randomBytes(16).toString('hex');
      campaign.shareEnabled = true;
      await campaign.save();
    }
    
    const shareUrl = (process.env.FRONTEND_URL || 'http://localhost:3000') + '/share/' + campaign.shareToken;
    
    res.json({
      success: true,
      data: { shareToken: campaign.shareToken, shareUrl, shareEnabled: campaign.shareEnabled }
    });
  } catch (error) {
    console.error('Generate share error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate share link' });
  }
});

module.exports = router;