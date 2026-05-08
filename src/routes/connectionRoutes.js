// backend/routes/connectionRoutes.js
const express = require('express');
const router = express.Router();

// ✅ SIMPLE HEALTH CHECK
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'running',
    uptime: process.uptime()
  });
});

// ✅ TEST BACKEND CONNECTION (for frontend to call)
router.post('/test-connection', (req, res) => {
  console.log('📡 Connection test received from frontend');
  console.log('   Method:', req.method);
  console.log('   Body:', req.body);
  
  res.json({
    success: true,
    message: '✅ Backend is reachable!',
    receivedData: req.body,
    backendTime: new Date().toISOString()
  });
});

// ✅ CHECK WHAT METHOD FRONTEND IS USING
router.all('/debug-method', (req, res) => {
  res.json({
    method: req.method,
    headers: req.headers,
    query: req.query,
    body: req.body
  });
});

// ✅ TEST EMAIL ENDPOINT
router.post('/test-email', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  const otp = Math.floor(100000 + Math.random() * 900000);
  
  res.json({
    success: true,
    message: 'Test email would be sent',
    otp: otp,
    email: email,
    note: 'In production, this actually sends email'
  });
});

// ✅ TEST AI ENDPOINT
router.post('/test-ai', (req, res) => {
  const { message } = req.body;
  
  res.json({
    success: true,
    message: `You said: "${message || 'nothing'}"`,
    reply: "This is a test response. Your connection works!",
    timestamp: new Date().toISOString()
  });
});

module.exports = router;