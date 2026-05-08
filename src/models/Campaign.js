 // backend/src/models/Campaign.js - CLEANED VERSION
const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  subject: {
    type: String,
    trim: true,
    default: ''
  },
  
  content: {
    type: String,
    default: ''
  },
  
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'failed'],
    default: 'draft'
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // ========== SHARING FIELDS (ONLY ONCE!) ==========
  shareToken: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },

  shareEnabled: {
    type: Boolean,
    default: false,
    index: true
  },

  shareCreatedAt: {
    type: Date,
    default: null
  },

  // ========== COUNTERS ==========
  viewCount: {
    type: Number,
    default: 0
  },

  subscriberCount: {
    type: Number,
    default: 0,
    index: true
  },

  // ========== ANALYTICS ==========
  shareAnalytics: {
    totalViews: { type: Number, default: 0 },
    totalClicks: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    lastViewedAt: { type: Date, default: null }
  },

  shareExpiredAt: {
    type: Date,
    default: null
  }

}, {
  timestamps: true
});

// ========== STATIC METHODS ==========
campaignSchema.statics.findByShareToken = function(shareToken) {
  return this.findOne({ 
    shareToken,
    shareEnabled: true,
    $or: [
      { shareExpiredAt: null },
      { shareExpiredAt: { $gt: new Date() } }
    ]
  });
};

// ========== INSTANCE METHODS ==========
campaignSchema.methods.generateShareLink = async function() {
  const crypto = require('crypto');
  
  if (!this.shareToken) {
    this.shareToken = crypto.randomBytes(16).toString('hex');
    this.shareEnabled = true;
    this.shareCreatedAt = new Date();
    await this.save();
  }
  
  return {
    token: this.shareToken,
    url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/share/${this.shareToken}`
  };
};

campaignSchema.methods.disableShare = async function() {
  this.shareEnabled = false;
  this.shareToken = undefined;
  return await this.save();
};

// ========== VIRTUAL FIELDS ==========
campaignSchema.virtual('shareLink').get(function() {
  if (this.shareToken && this.shareEnabled) {
    return `${process.env.FRONTEND_URL || 'http://localhost:3000'}/share/${this.shareToken}`;
  }
  return null;
});

const Campaign = mongoose.model('Campaign', campaignSchema);
module.exports = Campaign;