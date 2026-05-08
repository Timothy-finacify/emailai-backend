const mongoose = require('mongoose');

const CampaignViewSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  viewedAt: { type: Date, default: Date.now }
});

CampaignViewSchema.index({ campaignId: 1, viewedAt: 1 });

module.exports = mongoose.model('CampaignView', CampaignViewSchema);