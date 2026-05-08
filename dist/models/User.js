// backend/src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
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
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please enter a valid email'
        ]
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
        enum: {
            values: ['technology', 'ecommerce', 'healthcare', 'education', 'finance', 'realestate', 'other'],
            message: 'Invalid industry selected'
        },
        default: 'other',
        lowercase: true,
        trim: true
    },
    companySize: {
        type: String,
        enum: {
            values: ['1-10', '11-50', '51-200', '201-500', '500+'],
            message: 'Invalid company size selected'
        },
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
        type: String,
        select: false
    },
    otpExpires: {
        type: Date,
        select: false
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
    // PASSWORD RESET
    // ============================================
    passwordResetToken: {
        type: String,
        select: false
    },
    passwordResetExpires: {
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
        enum: {
            values: ['user', 'admin', 'premium'],
            message: 'Invalid role selected'
        },
        default: 'user',
        lowercase: true
    },
    // ============================================
    // ✅ PAYMENT & SUBSCRIPTION FIELDS
    // ============================================
    selectedPlan: {
        type: String,
        default: null,
        sparse: true,
        validate: {
            validator: function (v) {
                // Allow null or valid plan values
                return v === null || ['starter', 'pro', 'enterprise'].includes(v);
            },
            message: 'selectedPlan must be null, starter, pro, or enterprise'
        }
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    paymentDate: {
        type: Date,
        default: null
    },
    paypalTransactionId: {
        type: String,
        default: null
    },
    isFreeUser: {
        type: Boolean,
        default: false
    },
    userNumber: {
        type: Number,
        default: null
    },
    hasAccessToDashboard: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
// ============================================
// INDEXES FOR PERFORMANCE
// ============================================
userSchema.index({ email: 1, emailVerified: 1 });
userSchema.index({ isActive: 1, createdAt: -1 });
userSchema.index({ lastLogin: 1 });
userSchema.index({ paymentStatus: 1 });
// ============================================
// MIDDLEWARE: PASSWORD HASHING
// ============================================
userSchema.pre('save', async function (next) {
    // Skip if password hasn't been modified
    if (!this.isModified('password')) {
        return next();
    }
    try {
        // Check if password is already hashed
        if (this.password && (this.password.startsWith('$2a$') || this.password.startsWith('$2b$') || this.password.startsWith('$2y$'))) {
            return next();
        }
        // Validate password
        if (!this.password || this.password.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    }
    catch (error) {
        console.error('❌ Password hashing error:', error.message);
        next(error);
    }
});
// ============================================
// INSTANCE METHODS
// ============================================
// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    }
    catch (error) {
        console.error('❌ Password comparison error:', error);
        throw error;
    }
};
// Check if account is locked
userSchema.methods.isLocked = function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
};
// Increment login attempts
userSchema.methods.incLoginAttempts = async function () {
    try {
        // Reset attempts if lock has expired
        if (this.lockUntil && this.lockUntil < Date.now()) {
            this.loginAttempts = 1;
            this.lockUntil = undefined;
            return await this.save();
        }
        // Increment attempts
        this.loginAttempts += 1;
        // Lock account after 5 failed attempts
        if (this.loginAttempts >= 5 && !this.isLocked()) {
            this.lockUntil = new Date(Date.now() + 3600000); // Lock for 1 hour
            console.warn(`⚠️ Account locked for user: ${this.email}`);
        }
        return await this.save();
    }
    catch (error) {
        console.error('❌ Error incrementing login attempts:', error);
        throw error;
    }
};
// Reset login attempts after successful login
userSchema.methods.resetLoginAttempts = async function () {
    try {
        this.loginAttempts = 0;
        this.lockUntil = undefined;
        this.lastLogin = new Date();
        return await this.save();
    }
    catch (error) {
        console.error('❌ Error resetting login attempts:', error);
        throw error;
    }
};
// Create password reset token
userSchema.methods.createPasswordResetToken = function () {
    try {
        const resetToken = crypto.randomBytes(32).toString('hex');
        this.passwordResetToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        return resetToken;
    }
    catch (error) {
        console.error('❌ Error creating password reset token:', error);
        throw error;
    }
};
// Verify password reset token
userSchema.methods.verifyPasswordResetToken = function (token) {
    try {
        const hashed = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');
        return (hashed === this.passwordResetToken &&
            this.passwordResetExpires > Date.now());
    }
    catch (error) {
        console.error('❌ Error verifying password reset token:', error);
        return false;
    }
};
// Clear password reset token
userSchema.methods.clearPasswordResetToken = function () {
    this.passwordResetToken = undefined;
    this.passwordResetExpires = undefined;
    return this.save();
};
// Exclude sensitive fields from JSON response
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    // Remove sensitive fields
    delete user.password;
    delete user.refreshToken;
    delete user.passwordResetToken;
    delete user.passwordResetExpires;
    delete user.loginAttempts;
    delete user.lockUntil;
    delete user.otp;
    delete user.otpExpires;
    delete user.__v;
    return user;
};
// ============================================
// STATIC METHODS
// ============================================
// Find user by ID safely (without sensitive fields)
userSchema.statics.findByIdSafe = function (id) {
    return this.findById(id).select('-password -refreshToken -passwordResetToken -passwordResetExpires -loginAttempts -lockUntil -otp -otpExpires');
};
// Find users safely
userSchema.statics.findSafe = function (filter = {}) {
    return this.find(filter).select('-password -refreshToken -passwordResetToken -passwordResetExpires -loginAttempts -lockUntil -otp -otpExpires');
};
// Find one user safely
userSchema.statics.findOneSafe = function (filter = {}) {
    return this.findOne(filter).select('-password -refreshToken -passwordResetToken -passwordResetExpires -loginAttempts -lockUntil -otp -otpExpires');
};
module.exports = mongoose.model('User', userSchema);
//# sourceMappingURL=User.js.map