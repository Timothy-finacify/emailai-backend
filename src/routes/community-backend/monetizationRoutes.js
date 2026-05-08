// ============================================
// MONETIZATION ROUTES — Complete
// ============================================

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const { rateLimiter } = require('../../middleware/rateLimiter');
const Community = require('../../models/community-model/Community');
const Transaction = require('../../models/community-model/Transaction');

const PLATFORM_COMMISSION_RATE = 0.15;

// Apply rate limiter to all monetization routes
router.use(rateLimiter);

// GET /api/monetization/community/:communityId/earnings
router.get('/community/:communityId/earnings', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.communityId);
    if (!community) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    const userId = (req.user._id || req.user.id).toString();
    const ownerId = (community.owner || community.createdBy).toString();

    if (ownerId !== userId) {
      return res.status(403).json({ success: false, error: 'Owner only' });
    }

    const { period = 'monthly' } = req.query;
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'daily': startDate.setDate(now.getDate() - 1); break;
      case 'weekly': startDate.setDate(now.getDate() - 7); break;
      case 'monthly': startDate.setMonth(now.getMonth() - 1); break;
      case 'yearly': startDate.setFullYear(now.getFullYear() - 1); break;
      default: startDate.setMonth(now.getMonth() - 1);
    }

    const transactions = await Transaction.find({
      communityId: req.params.communityId,
      status: 'completed',
      date: { $gte: startDate, $lte: now }
    })
      .populate('subscriberId', 'name email')
      .sort({ date: -1 });

    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
    const platformFee = Math.round(totalRevenue * PLATFORM_COMMISSION_RATE);
    const ownerEarnings = totalRevenue - platformFee;

    const uniqueSubscribers = await Transaction.distinct('subscriberId', {
      communityId: req.params.communityId,
      status: 'completed',
      date: { $gte: startDate, $lte: now }
    });

    res.json({
      success: true,
      data: {
        totalRevenue,
        platformCommission: platformFee,
        ownerEarnings,
        subscriberCount: uniqueSubscribers.length,
        period,
        commissionRate: 15,
        transactions
      }
    });
  } catch (error) {
    console.error('Earnings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/monetization/community/:communityId/transactions
router.get('/community/:communityId/transactions', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.communityId);
    if (!community) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    const userId = (req.user._id || req.user.id).toString();
    const ownerId = (community.owner || community.createdBy).toString();

    if (ownerId !== userId) {
      return res.status(403).json({ success: false, error: 'Owner only' });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const total = await Transaction.countDocuments({ communityId: req.params.communityId });
    const transactions = await Transaction.find({ communityId: req.params.communityId })
      .populate('subscriberId', 'name email')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
          hasMore: skip + transactions.length < total
        }
      }
    });
  } catch (error) {
    console.error('Transactions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/monetization/community/:communityId/subscription-price
router.put('/community/:communityId/subscription-price', authMiddleware, async (req, res) => {
  try {
    const { price, currency = 'USD' } = req.body;

    const community = await Community.findById(req.params.communityId);
    if (!community) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    const userId = (req.user._id || req.user.id).toString();
    const ownerId = (community.owner || community.createdBy).toString();

    if (ownerId !== userId) {
      return res.status(403).json({ success: false, error: 'Owner only' });
    }

    const numericPrice = Math.max(0, Math.round(price || 0));
    community.isMonetized = numericPrice > 0;
    community.isPaid = numericPrice > 0;
    community.subscriptionPrice = numericPrice;
    community.price = numericPrice;
    community.subscriptionCurrency = currency.toUpperCase();
    await community.save();

    res.json({
      success: true,
      data: {
        price: community.subscriptionPrice,
        isMonetized: community.isMonetized,
        currency: community.subscriptionCurrency,
        ownerEarningsPerSubscriber: Math.round(numericPrice * 0.85),
        platformFeePerSubscriber: Math.round(numericPrice * 0.15)
      }
    });
  } catch (error) {
    console.error('Subscription price error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/monetization/community/:communityId/subscribe (Stripe integration placeholder)
router.post('/community/:communityId/subscribe', authMiddleware, async (req, res) => {
  try {
    const community = await Community.findById(req.params.communityId);
    if (!community) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    if (!community.isMonetized || community.subscriptionPrice <= 0) {
      return res.status(400).json({ success: false, error: 'This community is free' });
    }

    const userId = (req.user._id || req.user.id).toString();
    const alreadyMember = community.members.find(m => 
      (m.user?._id || m.user)?.toString() === userId
    );

    if (alreadyMember?.subscriptionActive) {
      return res.status(400).json({ success: false, error: 'Already subscribed' });
    }

    const amount = community.subscriptionPrice;
    const platformFee = Math.round(amount * PLATFORM_COMMISSION_RATE);
    const ownerPayout = amount - platformFee;

    // In production: process Stripe payment here
    // const paymentIntent = await stripe.paymentIntents.create({...});

    const transaction = await Transaction.create({
      communityId: community._id,
      subscriberId: userId,
      amount,
      platformFee,
      ownerPayout,
      currency: community.subscriptionCurrency,
      status: 'completed',
      date: new Date()
    });

    // Add/update member with active subscription
    if (alreadyMember) {
      alreadyMember.subscriptionActive = true;
      alreadyMember.subscriptionExpires = new Date(Date.now() + 30 * 86400000);
    } else {
      community.members.push({
        user: userId,
        role: 'member',
        joinedAt: new Date(),
        subscriptionActive: true,
        subscriptionExpires: new Date(Date.now() + 30 * 86400000)
      });
      community.memberCount = community.members.length;
      community.currentMembers = community.members.length;
    }

    await community.save();

    res.json({
      success: true,
      data: {
        transaction,
        isMember: true,
        subscriptionExpires: new Date(Date.now() + 30 * 86400000)
      }
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;