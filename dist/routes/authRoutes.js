// backend/src/routes/authRoutes.js
const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();
// ✅ Rate limiting for auth endpoints
const signInLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: 'Too many sign-in attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'development'
});
const otpLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3, // 3 requests per window
    message: 'Too many OTP requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'development'
});
// ✅ IMPROVED: Sign Up Validation with better rules
const signUpValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2-50 characters'),
    body('email')
        .trim()
        .toLowerCase()
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/)
        .withMessage('Password must contain uppercase letter, number, and special character'),
    // ✅ NEW: Add confirmPassword validation
    body('confirmPassword')
        .notEmpty()
        .withMessage('Password confirmation is required')
        .custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    }),
    body('phone')
        .optional()
        .trim()
        .matches(/^[\d\s\-\+\(\)]{5,20}$/)
        .withMessage('Invalid phone number format'),
    body('company')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Company name must be between 2-100 characters'),
    body('jobTitle')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Job title must be between 2-50 characters'),
    body('industry')
        .optional()
        .trim()
        .toLowerCase()
        .isIn(['technology', 'ecommerce', 'healthcare', 'education', 'finance', 'realestate', 'other'])
        .withMessage('Industry must be one of: technology, ecommerce, healthcare, education, finance, realestate, other'),
    body('companySize')
        .optional()
        .trim()
        .isIn(['1-10', '11-50', '51-200', '201-500', '500+'])
        .withMessage('Company size must be one of: 1-10, 11-50, 51-200, 201-500, 500+')
];
// ✅ Sign In Validation
const signInValidation = [
    body('email')
        .trim()
        .toLowerCase()
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];
// ✅ Email Validation
const emailValidation = [
    body('email')
        .trim()
        .toLowerCase()
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail()
];
// ✅ OTP Validation
const otpValidation = [
    body('email')
        .trim()
        .toLowerCase()
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail(),
    body('otp')
        .trim()
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be exactly 6 digits')
        .isNumeric()
        .withMessage('OTP must contain only numbers')
];
// ✅ Reset Password Validation
const resetPasswordValidation = [
    body('email')
        .trim()
        .toLowerCase()
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail(),
    body('otp')
        .trim()
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be exactly 6 digits')
        .isNumeric()
        .withMessage('OTP must contain only numbers'),
    body('newPassword')
        .notEmpty()
        .withMessage('New password is required')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/)
        .withMessage('Password must contain uppercase letter, number, and special character'),
    body('confirmPassword')
        .notEmpty()
        .withMessage('Password confirmation is required')
        .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
            throw new Error('Passwords do not match');
        }
        return true;
    })
];
// ✅ Routes with proper middleware order
/**
 * @route   POST /api/auth/check-email
 * @desc    Check if email is available
 * @access  Public
 */
router.post('/check-email', emailValidation, authController.checkEmail);
/**
 * @route   POST /api/auth/send-otp
 * @desc    Send OTP to email for verification
 * @access  Public
 */
router.post('/send-otp', otpLimiter, emailValidation, authController.sendOTP);
/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP code
 * @access  Public
 */
router.post('/verify-otp', otpLimiter, otpValidation, authController.verifyOTP);
/**
 * @route   POST /api/auth/signup
 * @desc    Register new user
 * @access  Public
 */
router.post('/signup', signUpValidation, authController.signUp);
/**
 * @route   POST /api/auth/signin
 * @desc    User login
 * @access  Public
 */
router.post('/signin', signInLimiter, signInValidation, authController.signIn);
/**
 * @route   POST /api/auth/signout
 * @desc    User logout
 * @access  Private
 */
router.post('/signout', authMiddleware, authController.signOut);
/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', authController.refreshToken);
/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset OTP
 * @access  Public
 */
router.post('/forgot-password', otpLimiter, emailValidation, authController.forgotPassword);
/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with OTP
 * @access  Public
 */
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);
router.post('/select-plan', authController.selectPlan);
router.post('/payments/create-paypal-order', authController.createPayPalOrder);
router.post('/payments/capture-paypal-order', authController.capturePayPalOrder);
router.post('/payments/check-status', authController.checkPaymentStatus);
module.exports = router;
//# sourceMappingURL=authRoutes.js.map