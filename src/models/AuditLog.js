const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  email: { type: String, default: 'anonymous' },
  action: { type: String, required: true },
  ipAddress: { type: String, default: '127.0.0.1' },
  userAgent: { type: String, default: '' },
  method: { type: String, default: 'GET' },
  endpoint: { type: String, default: '/' },
  statusCode: { type: Number, default: 200 },
  responseTime: { type: Number, default: 0 },
  details: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now, index: true }
});

AuditLogSchema.index({ user: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);