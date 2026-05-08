// backend/src/routes/authRoutes.js
const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ✅ Rate limiting for auth endpoints
const signInLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many sign-in attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development'
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  message: 'Too many OTP requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development'
});

// ✅ Sign Up Validation
const signUpValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2-50 characters'),
  
  body('email')
    .trim().toLowerCase()
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/)
    .withMessage('Password must contain uppercase letter, number, and special character'),
  
  body('confirmPassword')
    .notEmpty().withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  
  body('phone').optional().trim(),
  body('company').optional().trim(),
  body('jobTitle').optional().trim(),
  body('industry').optional().trim().toLowerCase(),
  body('companySize').optional().trim()
];

// ✅ Sign In Validation
const signInValidation = [
  body('email')
    .trim().toLowerCase()
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
];

// ✅ Email Validation
const emailValidation = [
  body('email')
    .trim().toLowerCase()
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail()
];

// ✅ OTP Validation
const otpValidation = [
  body('email')
    .trim().toLowerCase()
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  
  body('otp')
    .trim()
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits')
    .isNumeric().withMessage('OTP must contain only numbers')
];

// ✅ Reset Password Validation
const resetPasswordValidation = [
  body('email')
    .trim().toLowerCase()
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  
  body('otp')
    .trim()
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits')
    .isNumeric().withMessage('OTP must contain only numbers'),
  
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/)
    .withMessage('Password must contain uppercase letter, number, and special character'),
  
  body('confirmPassword')
    .notEmpty().withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

// ============================================
// ✅ ROUTES
// ============================================

router.post('/check-email', emailValidation, authController.checkEmail);
router.post('/send-otp', otpLimiter, emailValidation, authController.sendOTP);
router.post('/verify-otp', otpLimiter, otpValidation, authController.verifyOTP);
router.post('/signup', signUpValidation, authController.signUp);
router.post('/signin', signInLimiter, signInValidation, authController.signIn);
router.post('/signout', authMiddleware, authController.signOut);
router.post('/refresh', authController.refreshToken);

// ✅ Forgot Password (Request OTP)
router.post('/forgot-password', otpLimiter, emailValidation, authController.forgotPassword);

// ✅ Reset Password (Verify OTP & Set New Password)
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);

// ✅ Plan & Payment Routes
router.post('/select-plan', authMiddleware, authController.selectPlan);
router.post('/payments/create-paypal-order', authMiddleware, authController.createPayPalOrder);
router.post('/payments/capture-paypal-order', authMiddleware, authController.capturePayPalOrder);
router.post('/payments/check-status', authMiddleware, authController.checkPaymentStatus);

// ✅ Get Current User (ME) - Returns user with selectedPlan
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const User = require('../models/User');
    
    const user = await User.findOne({ email: req.user.email })
      .select('-password -otp -otpExpiry -__v');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    console.log('👤 /me called - Returning user:', {
      email: user.email,
      selectedPlan: user.selectedPlan,
      plan: user.plan
    });
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        selectedPlan: user.selectedPlan || 'starter',
        plan: user.plan || 'starter',
        avatar: user.avatar,
        profilePicture: user.profilePicture,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('❌ /me error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user data' 
    });
  }
});

// ✅ ONLY ONE module.exports at the end!
module.exports = router;