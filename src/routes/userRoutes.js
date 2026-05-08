// backend/src/routes/userRoutes.js
const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const router = express.Router();

// ✅ IMPROVED: Change Password Validation with better rules
const changePasswordValidation = [
  body('oldPassword')
    .notEmpty().withMessage('Current password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/)
    .withMessage('Password must contain uppercase letter, number, and special character')
    .custom((value, { req }) => {
      if (value === req.body.oldPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
  
  body('confirmPassword')
    .notEmpty().withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

// ✅ Email Verification Validation
const verifyEmailValidation = [
  body('otp')
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits')
    .isNumeric().withMessage('OTP must contain only numbers')
    .trim()
];

// ✅ Delete Account Validation
const deleteAccountValidation = [
  body('password')
    .notEmpty().withMessage('Password is required to delete account')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
];

// ✅ Update Profile Validation
const updateProfileValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('email').optional().trim().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('company').optional().trim(),
  body('jobTitle').optional().trim(),
  body('industry').optional().trim().toLowerCase(),
  body('companySize').optional().trim(),
  body('avatar').optional().trim()
];

// ============================================
// ✅ GET /api/user/profile (SINGLE DEFINITION)
// ============================================
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        selectedPlan: user.selectedPlan || user.plan || 'starter',
        plan: user.selectedPlan || user.plan || 'starter',
        emailVerified: user.emailVerified,
        avatar: user.avatar,
        role: user.role,
        hasAccessToDashboard: user.hasAccessToDashboard,
        paymentStatus: user.paymentStatus,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// ✅ PUT /api/user/profile - Update profile
// ============================================
router.put('/profile', authMiddleware, updateProfileValidation, async (req, res) => {
  try {
    const { name, phone, company, jobTitle, avatar } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (company) user.company = company;
    if (jobTitle) user.jobTitle = jobTitle;
    if (avatar) user.avatar = avatar;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        company: user.company,
        jobTitle: user.jobTitle,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// AI USAGE ROUTE
// ============================================
router.get('/ai-usage', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        used: 0,
        limit: 100,
        percentage: 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// USER PREFERENCES ROUTES
// ============================================
router.get('/preferences/:userId', authMiddleware, (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id || req.user._id;
    
    if (currentUserId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    res.json({
      userId,
      isAuthenticated: true,
      preferredTone: 'friendly',
      preferredLength: 'balanced',
      metadata: {
        version: '1.0',
        lastUpdated: new Date(),
        dataQuality: 'low'
      }
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/notification-preferences', authMiddleware, (req, res) => {
  try {
    res.json({
      success: true,
      preferences: {
        campaignPerformance: true,
        weeklyDigest: true,
        upgradeReminders: true,
        productUpdates: false,
        weeklyTips: true
      }
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/notification-preferences', authMiddleware, (req, res) => {
  try {
    const newPreferences = req.body;
    res.json({
      success: true,
      preferences: newPreferences,
      message: 'Notification preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// OTHER USER ROUTES (from userController)
// ============================================
router.put('/change-password', authMiddleware, changePasswordValidation, userController.changePassword);
router.delete('/account', authMiddleware, deleteAccountValidation, userController.deleteAccount);
router.post('/request-email-verification', authMiddleware, userController.requestEmailVerification);
router.post('/verify-email', authMiddleware, verifyEmailValidation, userController.verifyEmail);

// ✅ ONLY ONE module.exports AT THE VERY END
module.exports = router;