const AIAnalysisUsage = require('../models/AIAnalysisUsage');
const User = require('../models/User');

const PLAN_LIMITS = { starter: 10, professional: 30, pro: 30, premium: 50, enterprise: 50 };

const getUsage = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    if (!userId) return res.status(401).json({ success: false, message: 'User ID not found' });
    
    const user = await User.findById(userId).select('selectedPlan plan');
    const plan = user?.selectedPlan || user?.plan || 'starter';
    
    let usage = await AIAnalysisUsage.findOne({ userId: userId.toString() });
    if (!usage) { usage = new AIAnalysisUsage({ userId: userId.toString(), userEmail: req.user.email || `${userId}@placeholder.com`, userPlan: plan }); await usage.save(); }
    usage.checkMonthlyReset(); await usage.save();
    const available = usage.getAvailableAnalyses();
    res.json({ success: true, data: { plan, monthlyFreeUsed: available.monthlyFreeUsed, monthlyFreeLimit: PLAN_LIMITS[plan] || 10, monthlyFreeRemaining: available.monthlyFreeRemaining, purchasedCreditsRemaining: available.purchasedCreditsRemaining, totalAvailable: available.totalAvailable, totalAnalyses: usage.totalAnalyses } });
  } catch (error) { console.error('Get usage error:', error); res.status(500).json({ success: false, message: error.message }); }
};

const consumeAnalysis = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    if (!userId) return res.status(401).json({ success: false, message: 'User ID not found' });
    
    const user = await User.findById(userId).select('selectedPlan plan');
    const plan = user?.selectedPlan || user?.plan || 'starter';
    
    let usage = await AIAnalysisUsage.findOne({ userId: userId.toString() });
    if (!usage) usage = new AIAnalysisUsage({ userId: userId.toString(), userEmail: req.user.email || `${userId}@placeholder.com`, userPlan: plan });
    usage.userPlan = plan;
    const result = await usage.consumeAnalysis(req.body.campaignId, req.body.brief);
    res.json({ success: true, data: { consumed: true, source: result.source, remaining: result.remaining } });
  } catch (error) {
    if (error.message === 'No available analyses') return res.status(429).json({ success: false, message: 'Analysis limit reached', code: 'LIMIT_REACHED' });
    res.status(500).json({ success: false, message: error.message });
  }
};

const canAnalyze = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    if (!userId) return res.status(401).json({ success: false, message: 'User ID not found' });
    
    const user = await User.findById(userId).select('selectedPlan plan');
    const plan = user?.selectedPlan || user?.plan || 'starter';
    
    let usage = await AIAnalysisUsage.findOne({ userId: userId.toString() });
    if (!usage) { usage = new AIAnalysisUsage({ userId: userId.toString(), userEmail: req.user.email || `${userId}@placeholder.com`, userPlan: plan }); await usage.save(); }
    usage.checkMonthlyReset(); await usage.save();
    const freeLimit = PLAN_LIMITS[plan] || 10;
    const canUse = usage.monthlyUsage.count < freeLimit || usage.purchasedCredits > 0;
    res.json({ success: true, data: { canAnalyze: canUse, reason: canUse ? 'Credits available' : 'No credits remaining', freeRemaining: Math.max(0, freeLimit - usage.monthlyUsage.count), purchasedRemaining: usage.purchasedCredits } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const addPurchasedCredits = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    if (!userId) return res.status(401).json({ success: false, message: 'User ID not found' });
    let usage = await AIAnalysisUsage.findOne({ userId: userId.toString() });
    if (!usage) usage = new AIAnalysisUsage({ userId: userId.toString(), userEmail: req.user.email || `${userId}@placeholder.com`, userPlan: req.user.plan || req.user.selectedPlan || 'starter' });
    usage.purchasedCredits += req.body.calls || 0;
    await usage.save();
    res.json({ success: true, data: { creditsAdded: req.body.calls || 0, totalPurchasedCredits: usage.purchasedCredits } });
  } catch (error) { console.error('Add credits error:', error); res.status(500).json({ success: false, message: error.message }); }
};

const getHistory = async (req, res) => {
  res.json({ success: true, data: { history: [] } });
};

const resetMonthlyUsage = async (req, res) => {
  res.json({ success: true, message: 'Monthly usage reset' });
};

module.exports = { getUsage, consumeAnalysis, canAnalyze, addPurchasedCredits, getHistory, resetMonthlyUsage };