// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
/**
 * Main authentication middleware
 * Verifies JWT token and fetches user
 */
const authMiddleware = async (req, res, next) => {
    try {
        // ✅ Get Authorization header
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.warn('⚠️  Missing or invalid Authorization header from:', req.ip);
            return res.status(401).json({
                success: false,
                message: 'Authorization header missing or invalid. Expected "Bearer <token>"'
            });
        }
        // ✅ Extract token
        const token = authHeader.replace('Bearer ', '').trim();
        if (!token) {
            console.warn('⚠️  Empty token extracted from:', req.ip);
            return res.status(401).json({
                success: false,
                message: 'No authentication token provided'
            });
        }
        // ✅ Verify JWT with proper error handling
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        }
        catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                console.warn(`⚠️  Expired token from IP: ${req.ip}`);
                return res.status(401).json({
                    success: false,
                    message: 'Token has expired. Please sign in again.',
                    requiresSignIn: true,
                    expiredAt: jwtError.expiredAt
                });
            }
            else if (jwtError.name === 'JsonWebTokenError') {
                console.warn(`⚠️  Invalid token from IP: ${req.ip}`);
                return res.status(401).json({
                    success: false,
                    message: 'Invalid or malformed token'
                });
            }
            throw jwtError;
        }
        // ✅ Validate decoded token has required fields
        if (!decoded || !decoded.id) {
            console.warn('⚠️  Invalid token structure from:', req.ip);
            return res.status(401).json({
                success: false,
                message: 'Invalid token format'
            });
        }
        // ✅ Fetch user from database
        const user = await User.findById(decoded.id).select('-password -refreshToken -passwordResetToken -passwordResetExpires');
        if (!user) {
            console.warn(`⚠️  User not found for ID: ${decoded.id} from IP: ${req.ip}`);
            return res.status(401).json({
                success: false,
                message: 'User not found. Account may have been deleted.',
                requiresSignIn: true
            });
        }
        // ✅ Check if user is active
        if (!user.isActive) {
            console.warn(`⚠️  Inactive user attempted access: ${user.email}`);
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated'
            });
        }
        // ✅ Check if user is locked (too many failed login attempts)
        if (user.isLocked && user.isLocked()) {
            console.warn(`⚠️  Locked account attempted access: ${user.email}`);
            return res.status(403).json({
                success: false,
                message: 'Account is locked due to too many failed login attempts. Please try again later.'
            });
        }
        // ✅ Attach user and token to request
        req.user = user;
        req.token = token;
        req.userId = decoded.id;
        console.log(`✅ User authenticated: ${user.email}`);
        next();
    }
    catch (error) {
        console.error('❌ Auth middleware error:', error.message);
        // Don't reveal internal error details to client
        res.status(401).json({
            success: false,
            message: 'Authentication failed. Please sign in again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
/**
 * Middleware to require email verification
 * Must be used AFTER authMiddleware
 */
const requireVerification = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        if (!req.user.emailVerified) {
            console.warn(`⚠️  Unverified user attempted access: ${req.user.email}`);
            return res.status(403).json({
                success: false,
                message: 'Email verification required to access this resource',
                requiresVerification: true,
                userEmail: req.user.email
            });
        }
        console.log(`✅ Email verified user: ${req.user.email}`);
        next();
    }
    catch (error) {
        console.error('❌ Verification middleware error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Verification check failed'
        });
    }
};
/**
 * Middleware to require specific user roles
 * Usage: requireRole('admin', 'premium')
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
            }
            // ✅ Validate roles parameter
            if (!roles || roles.length === 0) {
                console.error('❌ requireRole called without roles');
                return res.status(500).json({
                    success: false,
                    message: 'Server configuration error'
                });
            }
            // ✅ Check if user has required role
            if (!roles.includes(req.user.role)) {
                console.warn(`⚠️  Unauthorized access attempt: User ${req.user.email} ` +
                    `(role: ${req.user.role}) tried to access resource requiring: ${roles.join(', ')}`);
                return res.status(403).json({
                    success: false,
                    message: 'You do not have sufficient permissions to access this resource',
                    requiredRoles: roles,
                    userRole: req.user.role
                });
            }
            console.log(`✅ Authorized user: ${req.user.email} (role: ${req.user.role})`);
            next();
        }
        catch (error) {
            console.error('❌ Role check middleware error:', error.message);
            res.status(500).json({
                success: false,
                message: 'Authorization check failed'
            });
        }
    };
};
/**
 * Optional: Middleware to track user activity (optional)
 */
const trackActivity = (req, res, next) => {
    try {
        if (req.user) {
            // Update last login time
            req.user.lastLogin = new Date();
            req.user.save().catch(err => console.error('❌ Error updating last login:', err.message));
        }
        next();
    }
    catch (error) {
        console.error('❌ Activity tracking error:', error.message);
        next(); // Don't block request if tracking fails
    }
};
module.exports = {
    authMiddleware,
    requireVerification,
    requireRole,
    trackActivity
};
//# sourceMappingURL=auth.js.map