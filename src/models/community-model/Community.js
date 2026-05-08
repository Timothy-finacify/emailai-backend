const mongoose = require('mongoose');

const CommunitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, default: '', maxlength: 1000 },
  photo: { type: String, default: '' },
  coverPhoto: { type: String, default: '' },
  bannerImage: { type: String, default: '' },
  avatarImage: { type: String, default: '' },
  rules: { type: String, default: '' },
  visibility: { type: String, enum: ['public', 'private', 'unlisted'], default: 'public' },
  isPrivate: { type: Boolean, default: false },
  isPaid: { type: Boolean, default: false },
  isMonetized: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
  subscriptionPrice: { type: Number, default: 0 },
  subscriptionCurrency: { type: String, default: 'USD' },
  planRequired: { type: String, default: 'starter' },
  category: { type: String, default: 'general' },
  tags: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['admin', 'moderator', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
    subscriptionActive: { type: Boolean, default: true },
    subscriptionExpires: { type: Date, default: null },
    badges: [{ name: String, icon: String, color: String }]
  }],
  socialLinks: [{
    platform: { 
      type: String, 
      enum: ['tiktok', 'facebook', 'youtube', 'instagram', 'x_twitter', 'linkedin', 'discord', 'slack'] 
    },
    url: { type: String },
    connected: { type: Boolean, default: false },
    lastSynced: { type: Date }
  }],
  memberCount: { type: Number, default: 1 },
  currentMembers: { type: Number, default: 1 },
  postCount: { type: Number, default: 0 },
  maxMembers: { type: Number, default: 1000 },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

CommunitySchema.index({ name: 'text', description: 'text' });
CommunitySchema.index({ category: 1, memberCount: -1 });

module.exports = mongoose.model('Community', CommunitySchema);