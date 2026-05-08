// models/AIAnalysisUsage.js
const mongoose = require('mongoose');

const aiAnalysisUsageSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userEmail: {
    type: String,
    required: false, // Changed from true to false
    default: 'user@placeholder.com'
  },
  userPlan: {
    type: String,
    enum: ['starter', 'professional', 'pro', 'premium', 'enterprise'],
    default: 'starter'
  },
  monthlyUsage: {
    count: { type: Number, default: 0 },
    month: { type: Number, default: () => new Date().getMonth() },
    year: { type: Number, default: () => new Date().getFullYear() }
  },
  purchasedCredits: { type: Number, default: 0 },
  totalAnalyses: { type: Number, default: 0 },
  analysisHistory: [{
    timestamp: { type: Date, default: Date.now },
    campaignId: String,
    brief: { goal: String, audience: String, message: String },
    source: { type: String, enum: ['monthly_free', 'purchased_credit'] }
  }],
  purchasedPackages: [{
    packageId: String,
    packageName: String,
    calls: Number,
    price: Number,
    purchaseDate: { type: Date, default: Date.now },
    paymentId: String
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save hook
aiAnalysisUsageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Check monthly reset
aiAnalysisUsageSchema.methods.checkMonthlyReset = function() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  if (this.monthlyUsage.month !== currentMonth || this.monthlyUsage.year !== currentYear) {
    this.monthlyUsage.count = 0;
    this.monthlyUsage.month = currentMonth;
    this.monthlyUsage.year = currentYear;
    return true;
  }
  return false;
};

// Get available analyses
aiAnalysisUsageSchema.methods.getAvailableAnalyses = function() {
  const PLAN_LIMITS = {
    starter: 10,
    professional: 30,
    pro: 30,
    premium: 50,
    enterprise: 50
  };
  
  const freeLimit = PLAN_LIMITS[this.userPlan] || 10;
  const freeRemaining = Math.max(0, freeLimit - this.monthlyUsage.count);
  
  return {
    monthlyFreeRemaining: freeRemaining,
    monthlyFreeLimit: freeLimit,
    monthlyFreeUsed: this.monthlyUsage.count,
    purchasedCreditsRemaining: this.purchasedCredits,
    totalAvailable: freeRemaining + this.purchasedCredits
  };
};

// Consume analysis
aiAnalysisUsageSchema.methods.consumeAnalysis = async function(campaignId, brief) {
  this.checkMonthlyReset();
  const PLAN_LIMITS = {
    starter: 10,
    professional: 30,
    pro: 30,
    premium: 50,
    enterprise: 50
  };
  
  const freeLimit = PLAN_LIMITS[this.userPlan] || 10;
  let source;
  
  if (this.monthlyUsage.count < freeLimit) {
    this.monthlyUsage.count += 1;
    source = 'monthly_free';
  } else if (this.purchasedCredits > 0) {
    this.purchasedCredits -= 1;
    source = 'purchased_credit';
  } else {
    throw new Error('No available analyses');
  }
  
  this.totalAnalyses += 1;
  
  this.analysisHistory.push({
    timestamp: new Date(),
    campaignId,
    brief: {
      goal: brief?.campaignGoal || 'unknown',
      audience: brief?.targetAudience?.substring(0, 50) || 'unknown',
      message: brief?.keyMessage?.substring(0, 50) || 'unknown'
    },
    source
  });
  
  await this.save();
  
  return {
    consumed: true,
    source,
    remaining: this.getAvailableAnalyses()
  };
};

module.exports = mongoose.model('AIAnalysisUsage', aiAnalysisUsageSchema);