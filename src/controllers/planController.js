// backend/src/controllers/planController.js
const User = require('../models/User');

// ============================================
// HELPER: Get PayPal Access Token
// ============================================
const getPayPalAccessToken = async () => {
  try {
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString('base64');

    const response = await fetch('https://api.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error('Failed to get PayPal access token');
    }
    
    return data.access_token;
  } catch (error) {
    console.error('❌ PayPal token error:', error);
    throw error;
  }
};

// ============================================
// 1. SELECT PLAN
// ============================================
exports.selectPlan = async (req, res) => {
  try {
    const { email, plan } = req.body;
    
    console.log(`📋 Plan selection request: ${email} - ${plan}`);
    
    // Validate plan
    if (!['starter', 'pro', 'enterprise'].includes(plan)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid plan. Choose: starter, pro, or enterprise' 
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify email is verified
    if (!user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email not verified'
      });
    }
    
    // Save selected plan
    user.selectedPlan = plan;
    user.paymentStatus = 'pending';
    await user.save();
    
    console.log(`✅ Plan saved: ${email} - ${plan}`);
    
    // Plan details
    const planDetails = {
      starter: { 
        price: 29.99, 
        name: 'Starter Plan',
        features: [
          'Up to 1,000 subscribers',
          'Basic AI features',
          '5 Templates',
          '1 User account',
          '10 API calls per month',
          '5 Communities'
        ]
      },
      pro: { 
        price: 99.99, 
        name: 'Professional Plan',
        features: [
          'Up to 20,000 subscribers',
          'Advanced AI features',
          '10 Templates',
          '5 User accounts',
          '50 API calls per month',
          '10 Communities',
          'Link to Facebook and TikTok'
        ]
      },
      enterprise: { 
        price: 299.99, 
        name: 'Premium Plan',
        features: [
          'Unlimited subscribers',
          'Advanced AI features',
          '20 Templates',
          '10 User accounts',
          '100 API calls per month',
          '50 Communities',
          'Link to all social media platforms'
        ]
      }
    };
    
    res.status(200).json({
      success: true,
      message: 'Plan selected successfully',
      data: {
        email: user.email,
        selectedPlan: plan,
        planDetails: planDetails[plan],
        nextStep: 'payment'
      }
    });
    
  } catch (error) {
    console.error('❌ Select plan error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to select plan'
    });
  }
};

// ============================================
// 2. CREATE PAYPAL ORDER
// ============================================
exports.createPayPalOrder = async (req, res) => {
  try {
    const { email, plan } = req.body;
    
    console.log(`💳 Creating PayPal order: ${email} - ${plan}`);
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Plan prices
    const planPrices = {
      starter: '29.99',
      pro: '99.99',
      enterprise: '299.99'
    };
    
    const planNames = {
      starter: 'Starter Plan',
      pro: 'Professional Plan',
      enterprise: 'Premium Plan'
    };
    
    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();
    
    // Create order
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: planPrices[plan]
          },
          description: planNames[plan]
        }
      ],
      return_url: `${process.env.FRONTEND_URL}/payment-success?email=${email}&plan=${plan}`,
      cancel_url: `${process.env.FRONTEND_URL}/plan-selection?email=${email}`
    };
    
    const response = await fetch('https://api.sandbox.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(orderData)
    });
    
    const order = await response.json();
    
    if (!response.ok) {
      console.error('❌ PayPal error:', order);
      return res.status(400).json({ 
        success: false, 
        message: 'Failed to create PayPal order',
        error: order
      });
    }
    
    console.log(`✅ PayPal order created: ${order.id}`);
    
    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        approveUrl: order.links.find(link => link.rel === 'approve')?.href
      }
    });
    
  } catch (error) {
    console.error('❌ Create PayPal order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order'
    });
  }
};

// ============================================
// 3. CAPTURE PAYPAL ORDER
// ============================================
exports.capturePayPalOrder = async (req, res) => {
  try {
    const { email, orderId } = req.body;
    
    console.log(`💰 Capturing PayPal order: ${orderId}`);
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();
    
    // Capture the order
    const response = await fetch(
      `https://api.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    const order = await response.json();
    
    if (order.status === 'COMPLETED') {
      // Payment successful - update user
      user.paymentStatus = 'completed';
      user.paymentDate = new Date();
      user.paypalTransactionId = orderId;
      user.hasAccessToDashboard = true;
      await user.save();
      
      console.log(`✅ Payment successful for ${email}`);
      
      res.status(200).json({
        success: true,
        message: '🎉 Payment successful!',
        data: {
          email: user.email,
          hasAccessToDashboard: true,
          selectedPlan: user.selectedPlan,
          nextStep: 'login'
        }
      });
    } else {
      // Payment failed
      user.paymentStatus = 'failed';
      await user.save();
      
      console.log(`❌ Payment failed for ${email}`);
      
      res.status(400).json({
        success: false,
        message: 'Payment could not be completed',
        data: { nextStep: 'retry-payment' }
      });
    }
    
  } catch (error) {
    console.error('❌ Capture PayPal order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to capture payment'
    });
  }
};

// ============================================
// 4. CHECK PAYMENT STATUS
// ============================================
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        email: user.email,
        isFreeUser: user.isFreeUser,
        paymentStatus: user.paymentStatus,
        hasAccessToDashboard: user.hasAccessToDashboard,
        selectedPlan: user.selectedPlan
      }
    });
    
  } catch (error) {
    console.error('❌ Check payment status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check payment status'
    });
  }
};

// ============================================
// 5. GET MY PLAN (Protected)
// ============================================
exports.getMyPlan = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        plan: user.selectedPlan,
        paymentStatus: user.paymentStatus,
        paymentDate: user.paymentDate,
        isFreeUser: user.isFreeUser
      }
    });
    
  } catch (error) {
    console.error('❌ Get my plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get plan'
    });
  }
};

// ============================================
// 6. UPGRADE PLAN (Protected)
// ============================================
exports.upgradePlan = async (req, res) => {
  try {
    const { newPlan } = req.body;
    
    if (!['starter', 'pro', 'enterprise'].includes(newPlan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan'
      });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const oldPlan = user.selectedPlan;
    user.selectedPlan = newPlan;
    user.paymentStatus = 'pending';
    await user.save();
    
    console.log(`📈 User upgraded from ${oldPlan} to ${newPlan}`);
    
    res.status(200).json({
      success: true,
      message: 'Plan upgraded successfully',
      data: {
        oldPlan,
        newPlan,
        nextStep: 'payment'
      }
    });
    
  } catch (error) {
    console.error('❌ Upgrade plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upgrade plan'
    });
  }
};

// ============================================
// 7. CANCEL PLAN (Protected)
// ============================================
exports.cancelPlan = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const cancelledPlan = user.selectedPlan;
    user.selectedPlan = null;
    user.paymentStatus = 'cancelled';
    await user.save();
    
    console.log(`❌ User cancelled ${cancelledPlan} plan`);
    
    res.status(200).json({
      success: true,
      message: 'Plan cancelled successfully',
      data: {
        cancelledPlan
      }
    });
    
  } catch (error) {
    console.error('❌ Cancel plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel plan'
    });
  }
};

module.exports = exports;