const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const crypto = require('crypto');

// Models
const User = mongoose.model('User');
const Community = mongoose.models.Community || require('../models/community-model/Community');
const Post = mongoose.models.Post || require('../models/community-model/Post');
const Transaction = mongoose.models.Transaction || require('../models/community-model/Transaction');
const Campaign = mongoose.model('Campaign');

// ============================================
// API KEY VERIFICATION
// ============================================
const verifyAPIKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({ error: 'API key required. Use header: x-api-key' });
  
  console.log('🔍 Looking for key:', apiKey);  // ADD THIS
  
  const user = await User.findOne({ 'apiKeys.key': apiKey });
  console.log('👤 User found:', user ? user.email : 'NO');  // ADD THIS
  
  if (!user) return res.status(401).json({ error: 'Invalid API key' });
  
  req.user = user;
  req.apiKey = apiKey;
  next();
};

router.use(verifyAPIKey);

// Rate limit middleware
router.use((req, res, next) => {
  const userPlan = (req.user.plan || req.user.selectedPlan || 'starter').toLowerCase();
  const PLAN_LIMITS = { starter: 0, pro: 30, enterprise: 50 };
  const limit = PLAN_LIMITS[userPlan] || 0;

  if (limit === 0) {
    return res.status(403).json({ error: 'API access requires Pro or Enterprise plan' });
  }

  const now = new Date();
  const keyDoc = req.user.apiKeys.find(k => k.key === req.apiKey);
  const callsThisMonth = keyDoc?.callCount || 0;

  if (callsThisMonth >= limit) {
    return res.status(429).json({ 
      error: `Rate limit exceeded. ${limit} calls/month for ${userPlan} plan.`,
      limit,
      used: callsThisMonth
    });
  }

  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', limit - callsThisMonth - 1);
  
  next();
});

// ============================================
// 1. USER / PROFILE
// ============================================

// GET /api/v1/me - Get current user
router.get('/v1/me', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -otp -apiKeys');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/v1/me - Update profile
router.put('/v1/me', async (req, res) => {
  try {
    const allowed = ['name', 'company', 'jobTitle', 'industry'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 2. CAMPAIGNS
// ============================================

// GET /api/v1/campaigns - List campaigns
router.get('/v1/campaigns', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = { userId: req.user._id };
    if (status) query.status = status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Campaign.countDocuments(query);
    const campaigns = await Campaign.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));

    res.json({ success: true, data: campaigns, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/campaigns/:id - Get single campaign
router.get('/v1/campaigns/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user._id });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/campaigns - Create campaign
router.post('/v1/campaigns', async (req, res) => {
  try {
    const campaign = await Campaign.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/v1/campaigns/:id - Update campaign
router.put('/v1/campaigns/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/v1/campaigns/:id
router.delete('/v1/campaigns/:id', async (req, res) => {
  try {
    await Campaign.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 3. SUBSCRIBERS
// ============================================

// GET /api/v1/subscribers - List subscribers (from campaigns)
router.get('/v1/subscribers', async (req, res) => {
  try {
    const campaigns = await Campaign.find({ userId: req.user._id });
    const subscribers = campaigns.reduce((all, c) => {
      return all.concat((c.subscribers || []).map(s => ({ ...s, campaignName: c.name })));
    }, []);
    res.json({ success: true, data: subscribers, total: subscribers.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 4. ANALYTICS
// ============================================

// GET /api/v1/analytics - Dashboard overview
router.get('/v1/analytics', async (req, res) => {
  try {
    const campaigns = await Campaign.find({ userId: req.user._id });
    const totalViews = campaigns.reduce((s, c) => s + (c.viewCount || 0), 0);
    const totalSubscribers = campaigns.reduce((s, c) => s + (c.subscriberCount || 0), 0);
    const activeCampaigns = campaigns.filter(c => c.status === 'sent' || c.status === 'active').length;

    // Communities analytics
    const communities = await Community.find({ owner: req.user._id });
    const totalMembers = communities.reduce((s, c) => s + (c.memberCount || 0), 0);
    const totalPosts = communities.reduce((s, c) => s + (c.postCount || 0), 0);

    res.json({
      success: true,
      data: {
        campaigns: { total: campaigns.length, active: activeCampaigns, totalViews, totalSubscribers },
        communities: { total: communities.length, totalMembers, totalPosts },
        conversionRate: campaigns.length > 0 ? ((totalSubscribers / Math.max(1, totalViews)) * 100).toFixed(1) + '%' : '0%'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 5. COMMUNITIES
// ============================================

// GET /api/v1/communities - List communities
router.get('/v1/communities', async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    let query = { isActive: true };
    if (search) query.name = { $regex: search, $options: 'i' };
    if (category) query.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Community.countDocuments(query);
    const communities = await Community.find(query)
      .select('name description category memberCount postCount isMonetized subscriptionPrice tags createdAt')
      .skip(skip).limit(parseInt(limit));

    res.json({ success: true, data: communities, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/communities/:id - Get single community
router.get('/v1/communities/:id', async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .select('name description category memberCount postCount isMonetized subscriptionPrice tags socialLinks createdAt');
    if (!community) return res.status(404).json({ error: 'Community not found' });
    res.json({ success: true, data: community });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/communities - Create community
router.post('/v1/communities', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const community = await Community.create({
      ...req.body,
      owner: req.user._id,
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
      memberCount: 1
    });
    res.status(201).json({ success: true, data: community });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/v1/communities/:id
router.put('/v1/communities/:id', async (req, res) => {
  try {
    const community = await Community.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true }
    );
    if (!community) return res.status(404).json({ error: 'Not found or not authorized' });
    res.json({ success: true, data: community });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/v1/communities/:id
router.delete('/v1/communities/:id', async (req, res) => {
  try {
    const community = await Community.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!community) return res.status(404).json({ error: 'Not found or not authorized' });
    await Post.deleteMany({ community: req.params.id });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 6. POSTS
// ============================================

// GET /api/v1/communities/:id/posts
router.get('/v1/communities/:id/posts', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const posts = await Post.find({ community: req.params.id, isSoftDeleted: false })
      .populate('author', 'name')
      .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    res.json({ success: true, data: posts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/communities/:id/posts
router.post('/v1/communities/:id/posts', async (req, res) => {
  try {
    const post = await Post.create({
      ...req.body,
      community: req.params.id,
      author: req.user._id
    });
    res.status(201).json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 7. MEMBERS
// ============================================

// GET /api/v1/communities/:id/members
router.get('/v1/communities/:id/members', async (req, res) => {
  try {
    const community = await Community.findById(req.params.id).populate('members.user', 'name email');
    if (!community) return res.status(404).json({ error: 'Community not found' });
    res.json({ success: true, data: community.members, total: community.memberCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 8. EARNINGS
// ============================================

// GET /api/v1/communities/:id/earnings
router.get('/v1/communities/:id/earnings', async (req, res) => {
  try {
    const community = await Community.findOne({ _id: req.params.id, owner: req.user._id });
    if (!community) return res.status(404).json({ error: 'Not found or not authorized' });
    
    const transactions = await Transaction.find({ communityId: req.params.id }).sort({ date: -1 }).limit(50);
    const totalRevenue = transactions.reduce((s, t) => s + t.amount, 0);
    
    res.json({
      success: true,
      data: {
        price: community.subscriptionPrice,
        memberCount: community.memberCount,
        totalRevenue,
        platformFee: Math.round(totalRevenue * 0.15),
        ownerEarnings: totalRevenue - Math.round(totalRevenue * 0.15),
        transactions
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 9. AI EMAIL GENERATION
// ============================================

// POST /api/v1/ai/generate-email
router.post('/v1/ai/generate-email', async (req, res) => {
  try {
    const { subject, campaignName, brief } = req.body;
    
    // Call your existing EmailBrain service
    const emailBrainService = require('../emailbrain/emailbrainService');
    const result = await emailBrainService.generateEmailWithBrain(
      req.user,
      subject || 'Email Subject',
      campaignName || 'API Campaign',
      { brief: brief || { goal: 'engagement', targetAudience: 'general' } }
    );
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;