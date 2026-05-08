  // backend/src/middleware/security.js
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const session = require('express-session');

// ==================== SQL INJECTION PREVENTION ====================
const sqlInjectionPreventer = (req, res, next) => {
  const sqlPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/i,
    /exec(\s|\+)+(s|x)p\w+/i,
    /UNION\s+SELECT/i,
    /SELECT\s+.*\s+FROM/i,
    /INSERT\s+INTO/i,
    /DELETE\s+FROM/i,
    /DROP\s+TABLE/i,
  ];

  const checkValue = (value) => {
    if (typeof value === 'string') {
      return sqlPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => checkValue(v));
    }
    return false;
  };

  if (checkValue(req.body) || checkValue(req.query) || checkValue(req.params)) {
    console.warn('🚨 SQL Injection attempt detected!', { ip: req.ip, path: req.path });
    return res.status(403).json({ success: false, message: 'Invalid input detected' });
  }
  next();
};

// ==================== INPUT SANITIZATION ====================
const sanitizeInput = (req, res, next) => {
  const sanitize = (value) => {
    if (typeof value === 'string') {
      value = value.replace(/[\x00-\x1F\x7F]/g, '');
      value = value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return value.trim();
    }
    if (typeof value === 'object' && value !== null) {
      Object.keys(value).forEach(key => { value[key] = sanitize(value[key]); });
      return value;
    }
    return value;
  };
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
};

// ==================== RATE LIMITING ====================
const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}-${req.headers['user-agent']}`
});

const paymentRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Payment attempts exceeded. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = (req.body?.email || '').toLowerCase();
    return `${email}-${req.ip}`;
  }
});

// ==================== CSRF PROTECTION ====================
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// backend/src/middleware/security.js

// backend/src/middleware/security.js

const validateCSRF = (req, res, next) => {
  // Skip CSRF in development if needed
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_CSRF === 'true') {
    return next();
  }
  
  const token = req.headers['x-csrf-token'] || 
                req.headers['csrf-token'] ||
                req.headers['X-CSRF-Token'] || 
                req.headers['CSRF-Token'];
  
  const sessionToken = req.session?.csrfToken;

  console.log('🔑 CSRF Validation:', {
    sessionID: req.sessionID?.substring(0, 10) + '...',
    headerToken: token?.substring(0, 10) + '...',
    sessionToken: sessionToken?.substring(0, 10) + '...',
    match: token === sessionToken
  });

  if (!token || !sessionToken) {
    return res.status(403).json({ 
      success: false, 
      message: 'CSRF token required' 
    });
  }

  if (token !== sessionToken) {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid CSRF token' 
    });
  }
  
  next();
};


// In your sqlInjectionPreventer middleware
const sqlInjectionPreventer = (req, res, next) => {
  // Whitelist legitimate API endpoints
  const safePaths = ['/api/campaigns', '/api/team', '/api/enterprise'];
  
  if (safePaths.some(path => req.path.startsWith(path))) {
    return next(); // Skip check for these paths
  }
  
  // Rest of your SQL injection check...
};

// ==================== PAYMENT SIGNATURE ====================
const PAYMENT_SECRET = process.env.PAYMENT_SECRET_KEY;

const generatePaymentSignature = (data) => {
  if (!PAYMENT_SECRET) {
    throw new Error('PAYMENT_SECRET_KEY not configured');
  }
  const payload = JSON.stringify({
    email: data.email?.toLowerCase().trim(),
    plan: data.plan,
    amount: data.amount,
    timestamp: data.timestamp,
    nonce: data.nonce,
  });
  return crypto.createHmac('sha256', PAYMENT_SECRET).update(payload).digest('hex');
};

const verifyPaymentSignature = (req, res, next) => {
  // Skip in development if needed
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_SIGNATURE === 'true') {
    return next();
  }

  if (!PAYMENT_SECRET) {
    console.error('❌ PAYMENT_SECRET_KEY not configured!');
    return res.status(500).json({ success: false, message: 'Payment service configuration error' });
  }

  const { signature, ...data } = req.body;
  
  if (!signature) {
    return res.status(400).json({ success: false, message: 'Payment signature required' });
  }

  const timestamp = data.timestamp;
  const now = Date.now();
  if (!timestamp || Math.abs(now - timestamp) > 5 * 60 * 1000) {
    console.warn('🚨 Expired payment signature!', { ip: req.ip });
    return res.status(403).json({ success: false, message: 'Payment session expired' });
  }

  const expectedSignature = generatePaymentSignature(data);
  
  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      console.warn('🚨 Invalid payment signature!', { ip: req.ip, email: data.email });
      return res.status(403).json({ success: false, message: 'Invalid payment signature' });
    }
  } catch {
    return res.status(403).json({ success: false, message: 'Invalid signature format' });
  }
  
  next();
};

// ==================== SESSION CONFIG ====================
// backend/src/middleware/security.js

// backend/src/middleware/security.js

// backend/src/middleware/security.js
// backend/src/middleware/security.js

const sessionConfig = session({
  secret: process.env.SESSION_SECRET || 'development-secret-change-this-in-production',
  resave: false,
  saveUninitialized: false,  // ✅ MUST be false
  rolling: true,  // ✅ ADD THIS
  cookie: {
    secure: false,  // false for localhost
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    sameSite: 'lax'
  }
});

// ==================== EXPORTS ====================
module.exports = {
  sqlInjectionPreventer,
  sanitizeInput,
  strictRateLimit,
  paymentRateLimit,
  generateCSRFToken,
  validateCSRF,
  generatePaymentSignature,
  verifyPaymentSignature,
  sessionConfig
};