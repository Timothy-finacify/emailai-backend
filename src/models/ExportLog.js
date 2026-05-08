// backend/src/models/ExportLog.js
const mongoose = require('mongoose')

const exportLogSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exportedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Index for faster queries
exportLogSchema.index({ campaignId: 1, userId: 1, exportedAt: -1 })

module.exports = mongoose.model('ExportLog', exportLogSchema)