// routes/aiAnalysisRoutes.js
const express = require('express');
const router = express.Router();
const aiAuthMiddleware = require('../middleware/aiauth');

const {
  getUsage,
  consumeAnalysis,
  canAnalyze,
  addPurchasedCredits,
  getHistory,
  resetMonthlyUsage
} = require('../controllers/aiAnalysisController');

// ============================================
// PUBLIC ENDPOINTS (No auth required)
// ============================================
// None currently - all require auth

// ============================================
// AUTH MIDDLEWARE - APPLY TO ALL ROUTES BELOW
// ============================================
router.use(aiAuthMiddleware);

// ============================================
// USAGE TRACKING ENDPOINTS
// ============================================

// GET /api/ai-analysis/usage - Get current usage stats
router.get('/usage', getUsage);

// GET /api/ai-analysis/can-analyze - Check if user can analyze
router.get('/can-analyze', canAnalyze);

// POST /api/ai-analysis/consume - Use one analysis credit
router.post('/consume', consumeAnalysis);

// GET /api/ai-analysis/history - Get analysis history
router.get('/history', getHistory);

// ============================================
// PAYMENT ENDPOINTS
// ============================================

// POST /api/ai-analysis/create-order - Create PayPal order
router.post('/create-order', async (req, res) => {
  try {
    const { packageId, packageName, calls, price, email } = req.body;
    const user = req.user; // ✅ Available because of aiAuthMiddleware
    
    console.log('💰 Creating AI package order:', { packageName, calls, price, email, userId: user.userId });
    
    // TODO: Integrate with PayPal SDK
    // const paypalOrder = await createPayPalOrder({ name: packageName, price, email });
    
    res.json({
      success: true,
      data: {
        orderId: `order_${Date.now()}`,
        approveUrl: `https://www.sandbox.paypal.com/checkoutnow?token=mock_token_${Date.now()}`,
        packageId,
        calls,
        price
      },
      message: 'Order created successfully'
    });
    
  } catch (error) {
    console.error('❌ Create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/ai-analysis/capture-order - Capture PayPal payment
router.post('/capture-order', async (req, res) => {
  try {
    const { orderId, packageId, calls, price, packageName } = req.body;
    const user = req.user; // ✅ Available because of aiAuthMiddleware
    
    console.log('💰 Capturing PayPal order:', orderId);
    
    // Add credits to user
    const AIAnalysisUsage = require('../models/AIAnalysisUsage');
    
    let usage = await AIAnalysisUsage.findOne({ userId: user.userId });
    
    if (!usage) {
      usage = new AIAnalysisUsage({
        userId: user.userId,
        userEmail: user.email,
        userPlan: user.plan || 'starter'
      });
    }
    
    usage.purchasedCredits += calls;
    usage.purchasedPackages.push({
      packageId,
      packageName: packageName || 'AI Analysis Package',
      calls,
      price,
      paymentId: orderId,
      purchaseDate: new Date()
    });
    
    await usage.save();
    
    res.json({
      success: true,
      data: {
        creditsAdded: calls,
        totalCredits: usage.purchasedCredits,
        message: `Successfully added ${calls} analysis credits!`
      }
    });
    
  } catch (error) {
    console.error('❌ Capture order error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/ai-analysis/add-credits - Add purchased credits (manual)
router.post('/add-credits', addPurchasedCredits);

// POST /api/ai-analysis/reset - Reset monthly usage (testing/admin)
router.post('/reset', resetMonthlyUsage);

module.exports = router;