const mongoose = require('mongoose');
const crypto = require('crypto');

const ApiKeySchema = new mongoose.Schema({
  name: { type: String, default: 'Production Key' },
  key: { type: String, unique: true },
  preview: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastUsed: { type: Date, default: null },
  callCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

ApiKeySchema.pre('validate', function(next) {
  if (!this.key) {
    const rawKey = crypto.randomBytes(32).toString('hex');
    this.key = 'eak_' + rawKey;
    this.preview = this.key.substring(0, 18) + '...';
  }
  next();
});

module.exports = mongoose.model('ApiKey', ApiKeySchema);