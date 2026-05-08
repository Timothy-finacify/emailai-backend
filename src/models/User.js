// ============================================
// FILE: backend/models/User.js
// PURPOSE: Complete User model with promo field
// ============================================

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

// ============================================
// SCHEMA DEFINITION (only ONE schema)
// ============================================

const userSchema = new mongoose.Schema({
  
  // ============================================
  // BASIC USER INFORMATION
  // ============================================
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    index: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  
  phone: { 
    type: String, 
    trim: true 
  },
  
  company: { 
    type: String, 
    trim: true 
  },
  
  jobTitle: { 
    type: String, 
    trim: true 
  },
  
  industry: {
    type: String,
    enum: ['technology', 'ecommerce', 'healthcare', 'education', 'finance', 'realestate', 'other'],
    default: 'other',
    lowercase: true,
    trim: true
  },
  
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
    default: '1-10'
  },
  
  avatar: { 
    type: String, 
    default: null 
  },

  // ============================================
  // EMAIL VERIFICATION & OTP
  // ============================================
  emailVerified: { 
    type: Boolean, 
    default: false, 
    index: true 
  },
  
  otp: { 
    type: String 
  },
  
  otpExpires: { 
    type: Date 
  },
  
  otpVerified: { 
    type: Boolean, 
    default: false 
  },

  // ============================================
  // AUTHENTICATION
  // ============================================
  refreshToken: { 
    type: String, 
    select: false 
  },

  // ============================================
  // PASSWORD RESET FIELDS
  // ============================================
  resetPasswordToken: { 
    type: String, 
    select: false 
  },
  
  resetPasswordExpires: { 
    type: Date, 
    select: false 
  },

  // ============================================
  // ACCOUNT SECURITY & LOGIN
  // ============================================
  lastLogin: { 
    type: Date, 
    default: null 
  },
  
  loginAttempts: { 
    type: Number, 
    default: 0, 
    select: false 
  },
  
  lockUntil: { 
    type: Date, 
    select: false 
  },
  
  isActive: { 
    type: Boolean, 
    default: true, 
    index: true 
  },

  // ============================================
  // USER ROLE & PERMISSIONS
  // ============================================
  role: {
    type: String,
    enum: ['user', 'admin', 'premium'],
    default: 'user',
    lowercase: true
  },

  // ============================================
  // ADDON METRICS
  // ============================================
  addonSubscribers: { 
    type: Number, 
    default: 0 
  },
  
  addonShares: { 
    type: Number, 
    default: 0 
  },
  
  addonAICredits: { 
    type: Number, 
    default: 0 
  },

  // ============================================
  // PAYMENT & SUBSCRIPTION FIELDS
  // ============================================
  selectedPlan: {
    type: String,
    enum: ['starter', 'pro', 'enterprise', 'premium', null],
    default: null
  },
  
  plan: { 
    type: String, 
    default: null 
  },
  
  billingCycle: { 
    type: String, 
    enum: ['monthly', 'yearly', null], 
    default: null 
  },
  
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', null], 
    default: null 
  },
  
  paymentDate: { 
    type: Date, 
    default: null 
  },
  
  paypalTransactionId: { 
    type: String, 
    default: null 
  },
  
  hasAccessToDashboard: { 
    type: Boolean, 
    default: false 
  },
  
  userNumber: { 
    type: Number, 
    default: null 
  },
  
  isFreeUser: { 
    type: Boolean, 
    default: false 
  },

  // ============================================
  // ENTERPRISE FIELDS
  // ============================================
  enterprise: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Enterprise', 
    default: null 
  },
  
  lastActive: { 
    type: Date, 
    default: Date.now 
  },

  // ============================================
  // ✅ PROMO CODE FIELD (NEW — ADDED HERE)
  // ============================================
  // This stores the promo code a user has applied.
  // null means no promo applied yet.
  // When they apply LAUNCH2026, this gets filled.
  
  promo: {
    code: {
      type: String,
      default: null
    },
    discountPercent: {
      type: Number,
      default: null
    },
    durationMonths: {
      type: Number,
      default: null
    },
    appliedAt: {
      type: Date,
      default: null
    },
    discountExpiresAt: {
      type: Date,
      default: null
    }
  },


  // ============================================
  // API KEYS
  // ============================================
  apiKeys: [{
    name: { type: String, default: 'API Key' },
    key: { type: String, required: true },
    preview: { type: String },
    lastUsed: { type: Date },
    callCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
  }]


}, { timestamps: true })

// ============================================
// INDEXES
// ============================================
userSchema.index({ email: 1, emailVerified: 1 })
userSchema.index({ isActive: 1, createdAt: -1 })
userSchema.index({ selectedPlan: 1 })

// ============================================
// PASSWORD HASHING MIDDLEWARE
// ============================================
// This runs BEFORE saving a user.
// If the password was changed, hash it.

userSchema.pre('save', async function(next) {
  // Only hash if password was modified
  if (!this.isModified('password')) return next()
  
  try {
    // Skip if already hashed (starts with $2)
    if (this.password?.startsWith('$2')) return next()
    
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// ============================================
// INSTANCE METHODS
// ============================================

// Compare a plain text password with the hashed one
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Check if account is locked (too many failed logins)
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now())
}

// Increment failed login attempts, lock if 5+
userSchema.methods.incLoginAttempts = async function() {
  if (typeof this.loginAttempts !== 'number' || isNaN(this.loginAttempts)) {
    this.loginAttempts = 0
  }
  
  this.loginAttempts += 1
  
  if (this.loginAttempts >= 5) {
    this.lockUntil = new Date(Date.now() + 15 * 60 * 1000) // Lock for 15 minutes
    console.warn(`⚠️ Account locked: ${this.email}`)
  }
  
  return this.save()
}

// Reset login attempts after successful login
userSchema.methods.resetLoginAttempts = async function() {
  this.loginAttempts = 0
  this.lockUntil = undefined
  this.lastLogin = new Date()
  return this.save()
}

// Remove sensitive fields when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject()
  delete user.password
  delete user.refreshToken
  delete user.resetPasswordToken
  delete user.resetPasswordExpires
  delete user.loginAttempts
  delete user.lockUntil
  delete user.otp
  delete user.otpExpires
  delete user.__v
  return user
}

// ============================================
// PROMO METHODS (NEW — ADDED HERE)
// ============================================

// Check if user has an active promo discount
userSchema.methods.hasActivePromo = function() {
  if (!this.promo || !this.promo.code) return false
  if (!this.promo.discountExpiresAt) return false
  
  const now = new Date()
  return now < this.promo.discountExpiresAt
}


// Get the current discount percentage (0 if none)
userSchema.methods.getDiscountPercent = function() {
  if (!this.hasActivePromo()) return 0
  return this.promo.discountPercent || 0
}


// ============================================
// EXPORT
// ============================================
module.exports = mongoose.model('User', userSchema)