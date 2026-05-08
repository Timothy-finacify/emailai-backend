// backend/src/middleware/authenticate.js
const jwt = require('jsonwebtoken');
const authenticate = (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Please log in first.'
            });
        }
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log(`✅ Token verified for user: ${decoded.id}`);
        next();
    }
    catch (error) {
        console.error('❌ Auth error:', error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please log in again.'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please log in again.'
            });
        }
        res.status(401).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};
module.exports = authenticate;
//# sourceMappingURL=authenticate.js.map