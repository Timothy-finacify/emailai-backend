const mongoose = require('mongoose');

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
  phone: {
    type: String,
    trim: true,
    default: null
  },
  location: {
    type: String,
    trim: true,
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'unsubscribed'],
    default: 'confirmed'
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
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
}, {
  timestamps: true
});

// Prevent duplicate subscribers for same campaign
SubscriberSchema.index({ campaignId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Subscriber', SubscriberSchema);