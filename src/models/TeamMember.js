const mongoose = require('mongoose');

const TeamMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enterprise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enterprise',
    required: false
  },
  role: {
    type: String,
    enum: ['admin', 'editor', 'viewer'],
    required: true,
    default: 'viewer'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  permissions: {
    canManageTeam: { type: Boolean, default: false },
    canCreateCampaigns: { type: Boolean, default: true },
    canDeleteCampaigns: { type: Boolean, default: false },
    canSendCampaigns: { type: Boolean, default: true },
    canViewAnalytics: { type: Boolean, default: true },
    canExportData: { type: Boolean, default: false },
    canAccessBilling: { type: Boolean, default: false },
    canManageAPI: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Auto-set permissions based on role
TeamMemberSchema.pre('save', function(next) {
  const rolePermissions = {
    admin: {
      canManageTeam: true,
      canCreateCampaigns: true,
      canDeleteCampaigns: true,
      canSendCampaigns: true,
      canViewAnalytics: true,
      canExportData: true,
      canAccessBilling: true,
      canManageAPI: true
    },
    editor: {
      canManageTeam: false,
      canCreateCampaigns: true,
      canDeleteCampaigns: false,
      canSendCampaigns: true,
      canViewAnalytics: true,
      canExportData: true,
      canAccessBilling: false,
      canManageAPI: false
    },
    viewer: {
      canManageTeam: false,
      canCreateCampaigns: false,
      canDeleteCampaigns: false,
      canSendCampaigns: false,
      canViewAnalytics: true,
      canExportData: false,
      canAccessBilling: false,
      canManageAPI: false
    }
  };
  
  this.permissions = rolePermissions[this.role] || rolePermissions.viewer;
  next();
});

module.exports = mongoose.model('TeamMember', TeamMemberSchema);