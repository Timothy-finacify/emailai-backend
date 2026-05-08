// backend/src/routes/emailRoutes.js
const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { generateEmailWithBrain } = require('../services/emailBrainBridge');
const { handleAnalyzeBrief } = require('../emailbrain/api/analyze-brief');

const router = express.Router();

const industryToNicheMap = {
  'finance': 'FIN_BANK_MM_001', 'banking': 'FIN_BANK_MM_001', 'financial': 'FIN_BANK_MM_001',
  'accounting': 'FIN_BANK_MM_001', 'insurance': 'FIN_BANK_MM_001', 'fintech': 'FIN_FINTECH_PM_032',
  'technology': 'SAAS_B2B_01', 'saas': 'SAAS_B2B_01', 'healthcare': 'HLTH_FIT_01',
  'ecommerce': 'SAAS_B2B_01', 'education': 'SAAS_B2B_01', 'realestate': 'SAAS_B2B_01', 'other': 'SAAS_B2B_01'
};

// ============================================
// GENERATE EMAIL
// ============================================
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { subject, campaignName, nicheId, stage, persona, brief } = req.body;
    const user = req.user;
    if (!subject || subject.trim().length === 0) return res.status(400).json({ success: false, message: 'Email subject is required' });
    if (!user) return res.status(401).json({ success: false, message: 'User not authenticated' });
    
    const userIndustry = (req.user?.industry || 'other').toLowerCase();
    const mappedNicheId = nicheId || industryToNicheMap[userIndustry] || 'SAAS_B2B_01';
    console.log('📧 Industry:', userIndustry, '→ Niche:', mappedNicheId);
    
    const options = {
      nicheId: mappedNicheId, stage: stage || "consideration", persona: persona || "the_pragmatist",
      audience: { companyName: req.user?.company || 'Valued Customer', userRole: req.user?.jobTitle || 'Professional', companySize: req.user?.companySize || '1-10', industry: req.user?.industry || 'other' },
      brief: brief || null
    };
    const result = await generateEmailWithBrain(user, subject, campaignName, options);
    res.json({ success: true, draft: result.draft, metadata: result.metadata, tracking: result.tracking });
  } catch (error) { console.error('❌ Generate error:', error.message); res.status(500).json({ success: false, message: 'Failed to generate' }); }
});

// ============================================
// SEND EMAIL (WITH TRACKING)
// ============================================
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { to, subject, html } = req.body;
    const transporter = req.app.get('emailTransporter');
    
    if (!transporter) return res.status(500).json({ success: false, message: 'Email service not configured' });
    if (!to || !subject) return res.status(400).json({ success: false, message: 'Recipient and subject required' });

    const htmlContent = html || `<p>${subject}</p>`;
    const trackingId = `trk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;
    
    const trackingPixel = `<img src="${baseUrl}/api/track/open/${trackingId}" width="1" height="1" style="display:none;" />`;
    const trackedLink = `<p style="text-align:center;margin-top:20px;"><a href="${baseUrl}/api/track/click/${trackingId}?url=${encodeURIComponent(`${baseUrl}/public/campaign/${trackingId}`)}" style="display:inline-block;padding:12px 28px;background:#8b5cf6;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">See It In Action →</a></p>`;
    const htmlWithTracking = htmlContent + trackedLink + trackingPixel;

    const info = await transporter.sendMail({
      from: `"EmailBrain" <${process.env.SMTP_USER}>`,
      to, subject, html: htmlWithTracking
    });

    await fetch(`${baseUrl}/api/track/record-send`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        trackingId, userId: req.user.id, 
        senderName: req.user?.name || 'EmailAI User',
        senderCompany: req.user?.company || '',
        brief: { campaignGoal: 'lead_generation', targetAudience: 'General', keyMessage: subject, desiredAction: 'Learn More' }
      })
    });

    console.log(`📧 Sent to ${to} | Tracking: ${trackingId}`);
    res.json({ success: true, message: `Sent to ${to}`, trackingId });
  } catch (error) { console.error('Send error:', error.message); res.status(500).json({ success: false, message: error.message }); }
});



// ============================================
// ANALYZE BRIEF
// ============================================
router.post('/analyze-brief', authMiddleware, handleAnalyzeBrief);

// ============================================
// NICHES
// ============================================
router.get('/niches', authMiddleware, async (req, res) => {
  const niches = [
    { id: 'FIN_BANK_MM_001', name: 'First-Time Homebuyer Advisory & Lending', sector: 'Finance' },
    { id: 'FIN_FINTECH_PM_032', name: 'Cross-Border Tuition Payment Rails', sector: 'Finance' },
    { id: 'SAAS_B2B_01', name: 'B2B SaaS', sector: 'Technology' },
    { id: 'HLTH_FIT_01', name: 'Fitness & Wellness', sector: 'Healthcare' }
  ];
  res.json({ success: true, niches, userIndustry: req.user?.industry });
});

router.get('/niche/:nicheId', authMiddleware, async (req, res) => {
  res.json({ success: true, niche: { id: req.params.nicheId, stages: ['awareness', 'consideration', 'decision', 'retention'], personas: ['the_pragmatist', 'the_innovator', 'the_saver', 'the_visionary'] } });
});

// ============================================
// CAMPAIGN FEEDBACK
// ============================================
router.post('/campaign-feedback', authMiddleware, async (req, res) => {
  console.log(`📊 Feedback: ${req.body.emailId}`);
  res.json({ success: true, message: 'Feedback recorded' });
});

module.exports = router;