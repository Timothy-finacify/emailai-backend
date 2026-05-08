 const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiKey = require('../models/ApiKey');

/**
 * Main authentication middleware
 * Verifies JWT token OR API key, and fetches user
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('⚠️  Missing or invalid Authorization header from:', req.ip);
      return res.status(401).json({
        success: false,
        message: 'Authorization header missing or invalid. Expected "Bearer <token>"'
      });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    
    if (!token) {
      console.warn('⚠️  Empty token from:', req.ip);
      return res.status(401).json({ success: false, message: 'No authentication token provided' });
    }

    // ============================================
    // CHECK FOR API KEY (starts with 'eak_')
    // ============================================
    if (token.startsWith('eak_')) {
      try {
        const apiKey = await ApiKey.findOne({ key: token, isActive: true });
        
        if (!apiKey) {
          console.warn('⚠️  Invalid API key from:', req.ip);
          return res.status(401).json({ success: false, message: 'Invalid or revoked API key.' });
        }

        apiKey.lastUsed = new Date();
        apiKey.callCount = (apiKey.callCount || 0) + 1;
        await apiKey.save();

        const user = await User.findById(apiKey.userId).select('-password');
        if (!user) {
          return res.status(401).json({ success: false, message: 'API key owner not found.' });
        }

        req.user = user;
        req.token = token;
        req.userId = user._id;
        console.log(`✅ API Key verified: ${apiKey.name} (${user.email})`);
        return next();
      } catch (dbError) {
        console.error('API Key lookup error:', dbError.message);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
    }

    // ============================================
    // JWT TOKEN VERIFICATION
    // ============================================
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        console.warn(`⚠️  Expired token from IP: ${req.ip}`);
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please sign in again.',
          requiresSignIn: true,
          expiredAt: jwtError.expiredAt
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        console.warn(`⚠️  Invalid token from IP: ${req.ip}`);
        return res.status(401).json({ success: false, message: 'Invalid or malformed token' });
      }
      throw jwtError;
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({ success: false, message: 'Invalid token format' });
    }

    const user = await User.findById(decoded.id).select('-password -refreshToken');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.', requiresSignIn: true });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated' });
    }

    req.user = user;
    req.token = token;
    req.userId = decoded.id;
    console.log(`✅ User authenticated: ${user.email}`);
    next();

  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};

const requireVerification = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
  if (!req.user.emailVerified) return res.status(403).json({ success: false, message: 'Email verification required', requiresVerification: true });
  next();
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    next();
  };
};

module.exports = { authMiddleware, requireVerification, requireRole };