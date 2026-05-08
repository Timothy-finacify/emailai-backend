// backend/src/routes/planRoutes.js
const express = require('express');
const router = express.Router();

// ✅ Import User model - adjust path if needed
const User = require('../models/User');

// ==================== SELECT PLAN ====================
router.post('/select', async (req, res) => {
  try {
    const { email, plan, billingCycle } = req.body;
    console.log('📋 Plan selected:', { email, plan, billingCycle });
    
    // Save plan to user
    if (email && plan) {
      const planToSave = plan === 'premium' ? 'enterprise' : plan;
      await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        { selectedPlan: planToSave, plan: planToSave, updatedAt: new Date() },
        { upsert: true, new: true }
      );
      console.log('✅ Plan saved:', planToSave);
    }
    
    res.json({
      success: true,
      message: 'Plan selected successfully',
      plan: plan,
      nextStep: plan === 'starter' ? 'dashboard' : 'payment'
    });
  } catch (error) {
    console.error('❌ Select plan error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== CREATE PLAN ORDER ====================
router.post('/create-order', async (req, res) => {
  try {
    const { email, plan, billingCycle, amount } = req.body;
    
    console.log('💳 BYPASS MODE - Creating test order for:', { email, plan, amount });
    
    // BYPASS PAYPAL - SKIP REAL PAYMENT
    return res.json({
      success: true,
      data: {
        orderId: 'TEST_' + Date.now(),
        approveUrl: `http://localhost:3000/payment-success?email=${email}&plan=${plan}&mock=true`
      }
    });
    
  } catch (error) {
    console.error('❌ Create order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== CONFIRM PAYMENT ====================
router.post('/confirm-payment', async (req, res) => {
  try {
    const { email, plan, mock } = req.body;
    
    console.log('💰 Confirming payment for:', { email, plan });
    
    // ✅ UPDATE USER'S PLAN IN DATABASE
    if (email && plan) {
      try {
        // Convert plan name if needed (premium -> enterprise)
        const planToSave = plan === 'premium' ? 'enterprise' : plan;
        
        const updatedUser = await User.findOneAndUpdate(
          { email: email.toLowerCase() },
          { 
            selectedPlan: planToSave,
            plan: planToSave,
            paymentDate: new Date(),
            updatedAt: new Date()
          },
          { new: true }
        );
        
        if (updatedUser) {
          console.log('✅ User plan updated in database:', {
            email: updatedUser.email,
            plan: updatedUser.selectedPlan
          });
        } else {
          console.warn('⚠️ User not found for email:', email);
          // Create user if doesn't exist (for testing)
          console.log('📝 Creating new user record...');
          const newUser = new User({
            email: email.toLowerCase(),
            selectedPlan: planToSave,
            plan: planToSave,
            paymentDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          });
          await newUser.save();
          console.log('✅ New user created with plan:', planToSave);
        }
      } catch (dbError) {
        console.error('❌ Database update error:', dbError.message);
        // Continue anyway - don't fail the payment confirmation
      }
    }
    
    res.json({
      success: true,
      paymentStatus: 'completed',
      selectedPlan: plan,
      message: mock ? 'Payment confirmed (Bypass Mode)' : 'Payment confirmed successfully'
    });
    
  } catch (error) {
    console.error('❌ Confirm payment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;