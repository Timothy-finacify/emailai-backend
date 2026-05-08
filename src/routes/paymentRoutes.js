// backend/src/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// ==================== CREATE PAYPAL ORDER ====================
router.post('/create-order', async (req, res) => {
  try {
    const { email, plan, billingCycle, amount } = req.body;
    
    console.log('💳 Creating payment order:', { email, plan, billingCycle, amount });
    
    // TODO: Integrate with PayPal API
    // For now, return mock response
    const orderId = `ORDER_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    res.json({
      success: true,
      data: {
        orderId: orderId,
        approveUrl: `https://www.sandbox.paypal.com/checkoutnow?token=${orderId}`
      }
    });
  } catch (error) {
    console.error('❌ Create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== CONFIRM PAYMENT ====================
router.post('/confirm-payment', async (req, res) => {
  try {
    const { email, plan, orderId } = req.body;
    
    console.log('✅ Confirming payment:', { email, plan, orderId });
    
    // TODO: Verify with PayPal API
    // Update user's plan in database
    
    res.json({
      success: true,
      paymentStatus: 'completed',
      selectedPlan: plan,
      message: 'Payment confirmed successfully'
    });
  } catch (error) {
    console.error('❌ Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== GENERATE PAYMENT SIGNATURE ====================
router.post('/generate-signature', async (req, res) => {
  try {
    const { email, plan, amount, timestamp, nonce } = req.body;
    const secret = process.env.PAYMENT_SECRET_KEY;
    
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: 'Payment service not configured'
      });
    }
    
    const payload = JSON.stringify({ email, plan, amount, timestamp, nonce });
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    
    res.json({
      success: true,
      signature: signature
    });
  } catch (error) {
    console.error('❌ Generate signature error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== GET PAYMENT STATUS ====================
router.get('/status', async (req, res) => {
  try {
    const { email } = req.query;
    
    // TODO: Check payment status in database
    
    res.json({
      success: true,
      hasPaid: false,
      plan: null
    });
  } catch (error) {
    console.error('❌ Get status error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;