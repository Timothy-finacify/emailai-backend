// ============================================
// FILE: backend/models/PromoCode.js
// PURPOSE: Blueprint for promo codes
// ============================================
// EXPIRE LOGIC: Code expires when EITHER:
//   1. 500,000 users have used it (maxUses)
//   2. 6 months have passed (validUntil)
// Whichever happens FIRST

const mongoose = require('mongoose')

const promoCodeSchema = new mongoose.Schema({
  
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  
  description: {
    type: String,
    default: ''
  },
  
  discountPercent: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  
  durationMonths: {
    type: Number,
    default: 3,
    min: 1
  },
  
  maxUses: {
    type: Number,
    default: 500000
  },
  
  currentUses: {
    type: Number,
    default: 0
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  validUntil: {
    type: Date,
    required: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// ============================================
// METHOD: Check if code is valid
// Returns false if EITHER limit is reached
// ============================================
promoCodeSchema.methods.isValid = function() {
  const now = new Date()
  
  // Check 1: Is code disabled?
  if (!this.isActive) {
    return false
  }
  
  // Check 2: Has it expired by time? (6 months passed)
  if (now > this.validUntil) {
    return false
  }
  
  // Check 3: Have 500,000 users used it?
  if (this.currentUses >= this.maxUses) {
    return false
  }
  
  // Both limits still have room — code is valid!
  return true
}

// ============================================
// METHOD: Increment usage count
// Call this when someone successfully uses the code
// ============================================
promoCodeSchema.methods.incrementUsage = async function() {
  this.currentUses += 1
  
  // If we just hit 500,000 users, auto-disable
  if (this.currentUses >= this.maxUses) {
    this.isActive = false
  }
  
  await this.save()
}

const PromoCode = mongoose.model('PromoCode', promoCodeSchema)

module.exports = PromoCode