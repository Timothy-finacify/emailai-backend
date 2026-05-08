const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  communityId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Community', 
    required: true, 
    index: true 
  },
  subscriberId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  amount: { type: Number, required: true, min: 0 },
  platformFee: { type: Number, required: true, min: 0 },
  ownerPayout: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD', uppercase: true },
  status: { 
    type: String, 
    enum: ['completed', 'pending', 'failed', 'refunded'], 
    default: 'completed',
    index: true
  },
  paymentMethod: { type: String, default: 'stripe' },
  date: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

TransactionSchema.index({ communityId: 1, date: -1 });
TransactionSchema.index({ subscriberId: 1, date: -1 });

module.exports = mongoose.model('Transaction', TransactionSchema);