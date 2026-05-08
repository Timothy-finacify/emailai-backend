const mongoose = require('mongoose');

// ============================================
// ANALYTICS SCHEMA
// ============================================
const AnalyticsSchema = new mongoose.Schema({
  enterpriseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enterprise'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  },
  type: {
    type: String,
    enum: ['view', 'subscribe', 'unsubscribe', 'share', 'export', 'login'],
    required: true
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    referrer: String,
    location: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

AnalyticsSchema.index({ enterpriseId: 1, createdAt: -1 });
AnalyticsSchema.index({ campaignId: 1, type: 1 });

// ============================================
// AUDIT LOG SCHEMA (SSO/Security)
// ============================================
const AuditLogSchema = new mongoose.Schema({
  enterpriseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enterprise',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: [
      'login', 'logout', 'login_failed',
      'team_invite_sent', 'team_invite_accepted', 'team_member_removed', 'team_role_changed',
      'campaign_created', 'campaign_updated', 'campaign_deleted',
      'settings_changed', 'api_key_generated', 'api_key_revoked',
      'sso_enabled', 'sso_disabled', '2fa_enabled', '2fa_disabled',
      'export_data', 'view_sensitive_data'
    ],
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: String,
  userAgent: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

AuditLogSchema.index({ enterpriseId: 1, createdAt: -1 });
AuditLogSchema.index({ userId: 1, action: 1 });

// ============================================
// SSO SETTINGS SCHEMA
// ============================================
const SSOSettingsSchema = new mongoose.Schema({
  enterpriseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enterprise',
    required: true,
    unique: true
  },
  saml: {
    enabled: { type: Boolean, default: false },
    entityId: String,
    ssoUrl: String,
    certificate: String,
    attributeMapping: {
      email: { type: String, default: 'email' },
      name: { type: String, default: 'name' },
      role: { type: String, default: 'role' }
    }
  },
  twoFactor: {
    enforced: { type: Boolean, default: false },
    method: { type: String, enum: ['app', 'sms', 'email'], default: 'app' }
  },
  session: {
    timeout: { type: Number, default: 30 }, // minutes
    maxConcurrent: { type: Number, default: 5 }
  },
  auditLogs: {
    enabled: { type: Boolean, default: true },
    retentionDays: { type: Number, default: 90 }
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// ============================================
// SUBSCRIBER SCHEMA (if not exists)
// ============================================
const SubscriberSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: { type: String, default: null },
  location: { type: String, default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'unsubscribed'],
    default: 'confirmed'
  },
  subscribedAt: { type: Date, default: Date.now },
  source: {
    type: String,
    enum: ['share_link', 'direct', 'import', 'api'],
    default: 'share_link'
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    referrer: String
  }
}, { timestamps: true });

SubscriberSchema.index({ campaignId: 1, email: 1 }, { unique: true });

// Export all models
module.exports = {
  Analytics: mongoose.model('Analytics', AnalyticsSchema),
  AuditLog: mongoose.model('AuditLog', AuditLogSchema),
  SSOSettings: mongoose.model('SSOSettings', SSOSettingsSchema),
  Subscriber: mongoose.models.Subscriber || mongoose.model('Subscriber', SubscriberSchema)
};