// middleware/aiauth.js
const jwt = require('jsonwebtoken');

const aiAuthMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No authentication token provided' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Extract user info from token
    req.user = {
      userId: decoded.userId || decoded.id || decoded.sub,
      email: decoded.email,
      plan: decoded.plan || decoded.selectedPlan || null,
      name: decoded.name
    };
    
    console.log(`🔐 AI Auth: ${req.user.email} (${req.user.plan} plan)`);
    
    next();
  } catch (error) {
    console.error('AI Auth error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired. Please login again.' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. Please login again.' 
      });
    }
    
    res.status(401).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};

module.exports = aiAuthMiddleware;