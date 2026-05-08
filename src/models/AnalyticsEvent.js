const mongoose = require('mongoose');

const AnalyticsEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', index: true },
  type: { type: String, enum: ['view', 'subscriber', 'click', 'open', 'share'], required: true },
  date: { type: Date, default: Date.now, index: true }
});

AnalyticsEventSchema.index({ userId: 1, date: -1 });
AnalyticsEventSchema.index({ userId: 1, type: 1, date: -1 });

module.exports = mongoose.model('AnalyticsEvent', AnalyticsEventSchema);