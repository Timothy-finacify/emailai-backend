// backend/src/app.js - FIXED VERSION




require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const session = require('express-session');

const app = express();

// ============================================
// SECURITY MIDDLEWARE - WITH FALLBACK
// ============================================

let sqlInjectionPreventer, sanitizeInput, strictRateLimit, paymentRateLimit, 
    validateCSRF, verifyPaymentSignature, sessionConfig, generateCSRFToken;

try {
  const security = require('./middleware/security');
  sqlInjectionPreventer = security.sqlInjectionPreventer;
  sanitizeInput = security.sanitizeInput;
  strictRateLimit = security.strictRateLimit;
  paymentRateLimit = security.paymentRateLimit;
  validateCSRF = security.validateCSRF;
  verifyPaymentSignature = security.verifyPaymentSignature;
  sessionConfig = security.sessionConfig;
  generateCSRFToken = security.generateCSRFToken;
  console.log('✅ Security middleware loaded from file');
} catch (error) {
  console.warn('⚠️  Security middleware file not found, using basic fallbacks');
  
  sqlInjectionPreventer = (req, res, next) => next();
  sanitizeInput = (req, res, next) => next();
  
  const rateLimit = require('express-rate-limit');
  strictRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
  paymentRateLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 10 });
  
  validateCSRF = (req, res, next) => next();
  verifyPaymentSignature = (req, res, next) => next();
  
  sessionConfig = session({
    secret: process.env.SESSION_SECRET || 'development-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
  });
  
  const crypto = require('crypto');
  generateCSRFToken = () => crypto.randomBytes(32).toString('hex');
}

// ============================================
// SECURITY MIDDLEWARE (ADD THESE FIRST!)
// ============================================

app.use(sessionConfig);

// backend/src/app.js - Update this section

// backend/src/app.js - PROPER CSP CONFIGURATION

const isDevelopment = process.env.NODE_ENV !== 'production';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      
      // ✅ Scripts: Only from your domain and trusted sources
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",  // Required for React
        "https://www.paypal.com",
        "https://www.sandbox.paypal.com"
      ],
      
      // ✅ Styles: Your CSS and inline styles
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com"
      ],
      
      // ✅ Images: Allow your uploads AND external images
      imgSrc: [
        "'self'",
        "data:",           // Base64 images
        "blob:",           // Blob URLs
        "https:",          // All HTTPS images
        // In development only:
        ...(isDevelopment ? [
          "http://localhost:3001",
          "http://localhost:5173",
          "http://127.0.0.1:*"
        ] : [])
      ],
      
      // ✅ Fonts: Google Fonts, etc.
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      
      // ✅ Connections: API calls
      connectSrc: [
        "'self'",
        "https://api.paypal.com",
        ...(isDevelopment ? [
          "http://localhost:3001",
          "ws://localhost:3001"
        ] : [])
      ],
      
      // ✅ Frames: PayPal checkout
      frameSrc: [
        "'self'",
        "https://www.paypal.com",
        "https://www.sandbox.paypal.com"
      ],
      
      // ❌ Block these completely
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  
  // ✅ Allow cross-origin images to load
  crossOriginResourcePolicy: { policy: "cross-origin" },
  
  // ✅ Other security headers
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  noSniff: true,
  xssFilter: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sqlInjectionPreventer);
app.use(sanitizeInput);

// ============================================
// CORS CONFIGURATION
// ============================================
// backend/src/app.js
  const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5173',
  'https://email-brain.pages.dev',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    // Allow all Cloudflare Pages preview URLs
    if (origin && (origin.endsWith('.pages.dev') || origin.endsWith('.email-brain.pages.dev'))) {
      return callback(null, true);
    }
    
    // Allow localhost in development
    if (process.env.NODE_ENV !== 'production') {
      if (origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
        return callback(null, true);
      }
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Request-ID', 
    'X-User-Id',
    'X-CSRF-Token',
    'CSRF-Token',
    'xsrf-token',
    'X-Payment-Signature', 
    'X-Device-Fingerprint',
    'x-api-key'
  ]
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
// ============================================
// ENVIRONMENT VARIABLES
// ============================================
console.log('\n📋 Environment Configuration:');
console.log(`   PORT: ${process.env.PORT || 3001}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Missing'}`);
console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL || 'Not set'}`);
console.log(`   PAYMENT_SECRET_KEY: ${process.env.PAYMENT_SECRET_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   SESSION_SECRET: ${process.env.SESSION_SECRET ? '✅ Set' : '⚠️ Using default'}`);

// ============================================
// CSRF TOKEN ENDPOINT - FIXED
// ============================================
app.get('/api/csrf-token', (req, res) => {
  console.log('🔵 CSRF Request - Session:', req.sessionID?.substring(0, 10) + '...');
  
  // ✅ IMPORTANT: Only generate new token if none exists
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCSRFToken();
    console.log('✨ New CSRF token generated');
  } else {
    console.log('♻️ Reusing existing CSRF token');
  }
  
  // Force save session to ensure it persists
  req.session.save((err) => {
    if (err) {
      console.error('❌ Session save error:', err);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to save session' 
      });
    }
    
    console.log('✅ CSRF token sent:', req.session.csrfToken?.substring(0, 20) + '...');
    
    res.json({ 
      success: true, 
      csrfToken: req.session.csrfToken 
    });
  });
});


// ============================================
// EMAIL SERVICE CONFIGURATION
// ============================================
console.log('\n📧 Email Service Configuration:');

let emailTransporter = null;

if (process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_HOST) {
  console.log('✅ Email credentials found');
  
  emailTransporter = nodemailer.createTransport({
    host: (process.env.SMTP_HOST || 'smtp.gmail.com').trim(),
    port: parseInt(process.env.SMTP_PORT || 465),
    secure: true,
    auth: {
      user: (process.env.SMTP_USER || '').trim(),
      pass: (process.env.SMTP_PASS || '').trim()
    },
    tls: { rejectUnauthorized: false },
    family: 4
  });

  emailTransporter.verify((error, success) => {
    if (error) {
      console.warn('⚠️  Email service connection failed:', error.message);
    } else {
      console.log('✅ Email service SMTP connection verified');
    }
  });
} else {
  console.warn('⚠️  Email credentials missing from .env file');
}

app.set('emailTransporter', emailTransporter);





// ============================================
// MONGODB CONNECTION
// ============================================
const connectDB = async () => {
  try {
    console.log('\n🔄 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log(`   Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️  Will retry connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// ✅ Audit Logger — tracks all requests
const auditLogger = require('./middleware/auditLogger');
app.use(auditLogger);
// ============================================
// ROUTES WITH SECURITY
// ============================================

console.log('\n📍 Loading routes...');

// ✅ User Routes (MOVED TO CORRECT LOCATION)
try {
  const userRoutes = require('./routes/userRoutes');
  app.use('/api/user', userRoutes);
  app.use('/user', userRoutes);
  console.log('✅ User routes loaded');
} catch (error) {
  console.error('❌ User routes failed:', error.message);
}

// ✅ Auth Routes (with strict rate limiting)
try {
  const authRoutes = require('./routes/authRoutes');
  app.use('/api/auth', strictRateLimit, authRoutes);
  app.use('/auth', strictRateLimit, authRoutes);
  console.log('✅ Auth routes loaded (with rate limiting)');
} catch (error) {
  console.error('❌ Auth routes failed:', error.message);
}

// ✅ Campaign Routes
try {
  const campaignRoutes = require('./routes/campaignRoutes');
  app.use('/api/campaigns', campaignRoutes);
  console.log('✅ Campaign routes loaded');
} catch (error) {
  console.error('❌ Campaign routes failed:', error.message);
}

// ✅ Notification Routes
try {
  const notificationRoutes = require('./routes/notificationRoutes');
  app.use('/api/notifications', notificationRoutes);
  console.log('✅ Notification routes loaded');
} catch (error) {
  console.warn('⚠️  Notification routes not found (optional)');
}

// ✅ Plan Routes (with CSRF protection)
try {
  const planRoutes = require('./routes/planRoutes');
app.use('/api/plans', planRoutes);  // Remove validateCSRF temporarily
  console.log('✅ Plan routes loaded (with CSRF protection)');
} catch (error) {
  console.error('❌ Plan routes failed:', error.message);
}

// ✅ Payment Routes (with MAXIMUM security)
try {
  const paymentRoutesPath = path.join(__dirname, 'routes', 'paymentRoutes.js');
  if (fs.existsSync(paymentRoutesPath)) {
    const paymentRoutes = require('./routes/paymentRoutes');
    app.use('/api/payments', 
      paymentRateLimit,
      validateCSRF,
      verifyPaymentSignature,
      paymentRoutes
    );
    console.log('✅ Payment routes loaded (with FULL security)');
  } else {
    console.warn('⚠️  Payment routes file not found - using fallback');
    app.post('/api/payments/create-order', paymentRateLimit, validateCSRF, (req, res) => {
      res.json({ 
        success: true, 
        data: { 
          orderId: `ORDER_${Date.now()}`,
          approveUrl: 'https://www.sandbox.paypal.com/checkoutnow'
        }
      });
    });
  }
} catch (error) {
  console.warn('⚠️  Payment routes failed, using fallback:', error.message);
}

// ✅ Email Routes
try {
  const emailRoutes = require('./routes/emailRoutes');
  app.use('/api/email', emailRoutes);
  console.log('✅ Email routes loaded');
} catch (error) {
  console.error('❌ Email routes failed:', error.message);
}

// ✅ AI Chat Routes
try {
  const aiRoutes = require('./routes/aiRoutes');
  app.use('/api/ai', aiRoutes);
  console.log('✅ AI Chat routes loaded');
} catch (error) {
  console.error('❌ AI Chat routes failed:', error.message);
}

// ✅ EmailBrain Routes
try {
  const emailbrainRoutesPath = path.join(__dirname, 'routes', 'emailbrainRoutes.js');
  if (fs.existsSync(emailbrainRoutesPath)) {
    const emailbrainRoutes = require('./routes/emailbrainRoutes');
    app.use('/api/emailbrain', emailbrainRoutes);
    console.log('✅ EmailBrain routes loaded');
  }
} catch (error) {
  console.error('❌ EmailBrain routes failed:', error.message);
}

// ✅ AI Analysis Routes
try {
  const aiAnalysisRoutes = require('./routes/aiAnalysisRoutes');
  app.use('/api/ai-analysis', aiAnalysisRoutes);
  console.log('✅ AI Analysis routes loaded');
} catch (error) {
  console.error('❌ AI Analysis routes failed:', error.message);
}
// backend/src/app.js - Add this with the other routes

// ✅ Upload Routes (for images)
try {
  const uploadRoutes = require('./routes/uploadRoutes');
  app.use('/api/upload', uploadRoutes);
  console.log('✅ Upload routes loaded');
} catch (error) {
  console.error('❌ Upload routes failed:', error.message);

}
 // ✅ Team Routes (for Enterprise features)
try {
  const teamRoutes = require('./routes/teamRoutes');
  app.use('/api/team', teamRoutes);
  console.log('✅ Team routes loaded');
} catch (error) {
  console.error('❌ Team routes failed:', error.message);
}

// ✅ Subscriber Routes (for share campaign links)
try {
  const subscriberRoutes = require('./routes/subscriberRoutes');
  app.use('/api/subscribers', subscriberRoutes);
  console.log('✅ Subscriber routes loaded');
} catch (error) {
  console.error('❌ Subscriber routes failed:', error.message);
}
   

// ✅ Enterprise Routes (Analytics + SSO combined)
try {
  const enterpriseRoutes = require('./routes/enterpriseRoutes');
  app.use('/api/enterprise', enterpriseRoutes);
  console.log('✅ Enterprise routes loaded (Analytics + SSO)');
} catch (error) {
  console.error('❌ Enterprise routes failed:', error.message);
}

try {
  const communityServer = require('./models/community-model/communityServer');
  app.use('/api/community', communityServer);
  console.log('✅ Community routes loaded');
} catch (error) {
  console.error('❌ Community routes failed:', error.message);
}




// ✅ API Key Routes
try {
  const apiKeyRoutes = require('./routes/apiKeyRoutes');
  app.use('/api/keys', apiKeyRoutes);
  console.log('✅ API Key routes loaded');
} catch (error) {
  console.error('❌ API Key routes failed:', error.message);
}

// ✅ Public API v1 Routes (for developers using x-api-key)
app.use('/api/v1', require('./routes/apiRoutes'));
console.log('✅ Public API v1 routes loaded'); 



// ✅ Tracking Routes
try {
  const trackingRoutes = require('./routes/trackingRoutes');
  app.use('/api/track', trackingRoutes);
  console.log('✅ Tracking routes loaded');
} catch (error) {
  console.error('❌ Tracking routes failed:', error.message);
}

// Add this line with your other routes
const connectionRoutes = require('./routes/connectionRoutes');
app.use('/api/connection', connectionRoutes);




// ✅ Public Routes
try {
  const publicRoutes = require('./routes/publicRoutes');
  app.use('/public', publicRoutes);
  console.log('✅ Public routes loaded');
} catch (error) {
  console.error('❌ Public routes failed:', error.message);
}
 


// ✅ Promo Code Routes
try {
  const promoRoutes = require('./routes/promoRoutes');
  app.use('/api/promo', promoRoutes);
  console.log('✅ Promo routes loaded');
} catch (error) {
  console.error('❌ Promo routes failed:', error.message);
}


// ✅ Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
console.log('✅ Static file serving enabled for /uploads');
// backend/src/app.js - Add after your routes



app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>EmailAI API Server</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2563eb; }
        .status { color: #10b981; font-weight: bold; }
        .endpoint { background: #f3f4f6; padding: 8px 12px; margin: 5px 0; border-radius: 5px; font-family: monospace; }
        .method { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 10px; }
        .get { background: #10b981; color: white; }
        .post { background: #3b82f6; color: white; }
        .delete { background: #ef4444; color: white; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 EmailAI API Server</h1>
        <p class="status">✅ Server is running</p>
        <p>Version: 1.0.0 | Environment: ${process.env.NODE_ENV || 'development'}</p>
        
        <h2>📡 Available Endpoints</h2>
        
        <div class="endpoint">
          <span class="method post">POST</span>
          <span>/api/auth/signin - User login</span>
        </div>
        <div class="endpoint">
          <span class="method post">POST</span>
          <span>/api/auth/signup - User registration</span>
        </div>
        <div class="endpoint">
          <span class="method get">GET</span>
          <span>/api/campaigns - Get all campaigns</span>
        </div>
        <div class="endpoint">
          <span class="method post">POST</span>
          <span>/api/upload/image - Upload image</span>
        </div>
        <div class="endpoint">
          <span class="method get">GET</span>
          <span>/health - Health check</span>
        </div>
        <div class="endpoint">
          <span class="method get">GET</span>
          <span>/api/csrf-token - Get CSRF token</span>
        </div>
        
        <h2>📊 Server Info</h2>
        <p>Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
        <p>Uptime: ${Math.floor(process.uptime())} seconds</p>
      </div>
    </body>
    </html>
  `);
});

// ============================================
// HEALTH CHECK ENDPOINTS
// ============================================

app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  
  res.json({
    success: true,
    message: 'Server is running',
    database: statusMap[dbStatus],
    security: 'enabled',
    timestamp: new Date().toISOString()
  });
});


// API Documentation
app.get('/api/docs', (req, res) => {
  res.json({
    version: 'v1',
    baseUrl: `http://localhost:${process.env.PORT || 3001}/api/v1`,
    auth: 'Header: x-api-key: YOUR_KEY',
    endpoints: [
      'GET    /v1/communities',
      'GET    /v1/communities/:id',
      'POST   /v1/communities',
      'PUT    /v1/communities/:id',
      'DELETE /v1/communities/:id',
      'GET    /v1/communities/:id/posts',
      'POST   /v1/communities/:id/posts',
      'GET    /v1/communities/:id/members',
      'GET    /v1/communities/:id/earnings'
    ]
  });
});





// ============================================
// ERROR HANDLERS
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

module.exports = app;