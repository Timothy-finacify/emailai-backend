// backend/src/app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const app = express();
// ============================================
// MIDDLEWARE
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(helmet());
// CORS Configuration
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin)
            return callback(null, true);
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:5173',
            'http://localhost:5174',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
            'http://127.0.0.1:5173',
            process.env.FRONTEND_URL
        ].filter(Boolean);
        if (process.env.NODE_ENV !== 'production') {
            if (origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
                return callback(null, true);
            }
        }
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            console.log('❌ CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-User-Id']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
// ============================================
// ENVIRONMENT VARIABLES
// ============================================
console.log('\n📋 Environment Configuration:');
console.log(`   PORT: ${process.env.PORT || 3001}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   MONGODB_URI: ${process.env.MONGODB_URI}`);
console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL}`);
// ============================================
// EMAIL SERVICE CONFIGURATION
// ============================================
console.log('\n📧 Email Service Configuration:');
let emailTransporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_HOST) {
    console.log('✅ Email credentials found:');
    console.log(`   SMTP_HOST: ${process.env.SMTP_HOST}`);
    console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || 587}`);
    console.log(`   SMTP_USER: ${process.env.SMTP_USER}`);
    console.log(`   SMTP_PASS: [${process.env.SMTP_PASS.length} chars]`);
    emailTransporter = nodemailer.createTransport({
        host: (process.env.SMTP_HOST || 'smtp.gmail.com').trim(),
        port: parseInt(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true' ? true : false,
        auth: {
            user: (process.env.SMTP_USER || '').trim(),
            pass: (process.env.SMTP_PASS || '').trim()
        }
    });
    emailTransporter.verify((error, success) => {
        if (error) {
            console.warn('⚠️  Email service connection failed (non-blocking):', error.message);
        }
        else {
            console.log('✅ Email service SMTP connection verified');
        }
    });
}
else {
    console.warn('⚠️  Email credentials missing from .env file');
}
// Make emailTransporter available to routes
app.set('emailTransporter', emailTransporter);
// ============================================
// MONGODB CONNECTION
// ============================================
const connectDB = async () => {
    try {
        console.log('\n🔄 Connecting to MongoDB...');
        console.log(`   URI: ${process.env.MONGODB_URI}`);
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
        });
        console.log('✅ Mongoose connected to MongoDB');
        console.log(`✅ MongoDB connected successfully`);
        console.log(`   Database: ${mongoose.connection.name}`);
    }
    catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        console.log('⚠️  Will retry connection in 5 seconds...');
        setTimeout(connectDB, 5000);
    }
};
connectDB();
mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose error:', err.message);
});
mongoose.connection.on('disconnected', () => {
    console.log('⚠️  Mongoose disconnected from MongoDB');
});
// ============================================
// ROUTES
// ============================================
console.log('\n📍 Loading routes...');
// ✅ Auth Routes
try {
    app.use('/api/auth', require('./routes/authRoutes'));
    console.log('✅ Auth routes loaded');
}
catch (error) {
    console.error('❌ Auth routes failed:', error.message);
}
// ✅ User Routes
try {
    app.use('/api/user', require('./routes/userRoutes'));
    console.log('✅ User routes loaded');
}
catch (error) {
    console.error('❌ User routes failed:', error.message);
}
// ✅ Plan Routes
try {
    app.use('/api/plans', require('./routes/planRoutes'));
    console.log('✅ Plan routes loaded');
}
catch (error) {
    console.error('❌ Plan routes failed:', error.message);
}
// ✅ Email Routes
try {
    const emailRoutes = require('./routes/emailRoutes');
    app.use('/api/email', emailRoutes);
    console.log('✅ Email routes loaded with EmailBrain');
}
catch (error) {
    console.error('❌ Email routes failed:', error.message);
}
// ✅ EmailBrain Routes - FIXED PATH
try {
    const emailbrainRoutesPath = path.join(__dirname, 'routes', 'emailbrainRoutes.js');
    if (fs.existsSync(emailbrainRoutesPath)) {
        const emailbrainRoutes = require('./routes/emailbrainRoutes');
        app.use('/api/emailbrain', emailbrainRoutes);
        console.log('✅ EmailBrain routes loaded');
    }
    else {
        console.warn('⚠️  EmailBrain routes file not found at:', emailbrainRoutesPath);
    }
}
catch (error) {
    console.error('❌ EmailBrain routes failed:', error.message);
}
// Campaign Routes (if exists)
try {
    const campaignPath = path.join(__dirname, 'routes', 'campaignRoutes.js');
    if (fs.existsSync(campaignPath)) {
        app.use('/api/campaigns', require('./routes/campaignRoutes'));
        console.log('✅ Campaign routes loaded');
    }
}
catch (error) {
    // Silent fail - campaign routes are optional
}
// Subscriber Routes (if exists)
try {
    const subscriberPath = path.join(__dirname, 'routes', 'subscriberRoutes.js');
    if (fs.existsSync(subscriberPath)) {
        app.use('/api/subscribers', require('./routes/subscriberRoutes'));
        console.log('✅ Subscriber routes loaded');
    }
}
catch (error) {
    // Silent fail - subscriber routes are optional
}
// ✅ AI Chat Routes
try {
    app.use('/api/ai', require('./routes/aiRoutes'));
    console.log('✅ AI Chat routes loaded');
}
catch (error) {
    console.error('❌ AI Chat routes failed:', error.message);
}
// ============================================
// HEALTH CHECK ENDPOINTS
// ============================================
app.get('/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState;
    const statusMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };
    res.json({
        success: true,
        message: 'Server is running',
        database: statusMap[dbStatus],
        databaseReady: dbStatus === 1,
        timestamp: new Date().toISOString()
    });
});
app.get('/api/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState;
    const statusMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };
    res.json({
        success: true,
        message: 'Server is running',
        database: statusMap[dbStatus],
        databaseReady: dbStatus === 1,
        timestamp: new Date().toISOString()
    });
});
// ============================================
// ERROR HANDLERS
// ============================================
// 404 handler
app.use((req, res) => {
    console.log('404 Not Found:', req.method, req.url);
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.url}`
    });
});
// Error handler
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err.message);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
});
module.exports = app;
//# sourceMappingURL=app.js.map