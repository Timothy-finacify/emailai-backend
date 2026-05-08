// backend/src/routes/userRoutes.js
const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();
// ✅ IMPROVED: Change Password Validation with better rules
const changePasswordValidation = [
    body('oldPassword')
        .notEmpty()
        .withMessage('Current password is required')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters'),
    body('newPassword')
        .notEmpty()
        .withMessage('New password is required')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/)
        .withMessage('Password must contain uppercase letter, number, and special character')
        .custom((value, { req }) => {
        if (value === req.body.oldPassword) {
            throw new Error('New password must be different from current password');
        }
        return true;
    }),
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
// ✅ Email Verification Validation
const verifyEmailValidation = [
    body('otp')
        .notEmpty()
        .withMessage('OTP is required')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be exactly 6 digits')
        .isNumeric()
        .withMessage('OTP must contain only numbers')
        .trim()
];
// ✅ Delete Account Validation
const deleteAccountValidation = [
    body('password')
        .notEmpty()
        .withMessage('Password is required to delete account')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
];
// ✅ IMPROVED: Update Profile Validation with email field
const updateProfileValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage('Name must be at least 2 characters')
        .isLength({ max: 50 })
        .withMessage('Name cannot exceed 50 characters'),
    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Invalid email format')
        .normalizeEmail(),
    body('phone')
        .optional()
        .trim()
        .matches(/^[\d\s\-\+\(\)]+$/)
        .withMessage('Invalid phone number format')
        .isLength({ min: 5, max: 20 })
        .withMessage('Phone number must be between 5-20 characters'),
    body('company')
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage('Company name must be at least 2 characters')
        .isLength({ max: 100 })
        .withMessage('Company name cannot exceed 100 characters'),
    body('jobTitle')
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage('Job title must be at least 2 characters')
        .isLength({ max: 50 })
        .withMessage('Job title cannot exceed 50 characters'),
    body('industry')
        .optional()
        .trim()
        .toLowerCase()
        .isIn(['technology', 'ecommerce', 'healthcare', 'education', 'finance', 'realestate', 'other'])
        .withMessage('Invalid industry selection. Must be one of: technology, ecommerce, healthcare, education, finance, realestate, other'),
    body('companySize')
        .optional()
        .trim()
        .isIn(['1-10', '11-50', '51-200', '201-500', '500+'])
        .withMessage('Invalid company size selection. Must be one of: 1-10, 11-50, 51-200, 201-500, 500+'),
    body('avatar')
        .optional()
        .trim()
        .isURL()
        .withMessage('Invalid avatar URL')
];
// ✅ All routes are protected with authMiddleware
/**
 * @route   GET /api/user/profile
 * @desc    Get authenticated user profile
 * @access  Private
 */
router.get('/profile', authMiddleware, userController.getProfile);
/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authMiddleware, updateProfileValidation, userController.updateProfile);
/**
 * @route   PUT /api/user/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', authMiddleware, changePasswordValidation, userController.changePassword);
/**
 * @route   DELETE /api/user/account
 * @desc    Delete user account (requires password confirmation)
 * @access  Private
 */
router.delete('/account', authMiddleware, deleteAccountValidation, userController.deleteAccount);
/**
 * @route   POST /api/user/request-email-verification
 * @desc    Request email verification code to be sent
 * @access  Private
 */
router.post('/request-email-verification', authMiddleware, userController.requestEmailVerification);
/**
 * @route   POST /api/user/verify-email
 * @desc    Verify email with OTP code
 * @access  Private
 */
router.post('/verify-email', authMiddleware, verifyEmailValidation, userController.verifyEmail);
module.exports = router;
//# sourceMappingURL=userRoutes.js.map