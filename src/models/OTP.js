// backend/src/models/OTP.js
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    },
    code: {
      type: String,
      required: true
    },
    purpose: {
      type: String,
      enum: ['verification', 'password-reset'],
      default: 'verification'
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 } // Auto-delete after expiration
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Index for automatic deletion of expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OTP', otpSchema);