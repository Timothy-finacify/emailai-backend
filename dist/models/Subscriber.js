// backend/src/models/Subscriber.js
const mongoose = require('mongoose');
const subscriberSchema = new mongoose.Schema({
    // Campaign Reference
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign',
        required: [true, 'Campaign ID is required'],
        index: true
    },
    // User Reference (campaign creator)
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    // Subscriber Info
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please enter a valid email'
        ],
        index: true
    },
    phone: {
        type: String,
        trim: true,
        default: null
    },
    // Tracking Info
    ipAddress: {
        type: String,
        default: 'unknown'
    },
    userAgent: {
        type: String,
        default: 'unknown'
    },
    source: {
        type: String,
        enum: ['share_link', 'direct', 'import', 'api'],
        default: 'share_link',
        index: true
    },
    // Engagement
    clicks: {
        type: Number,
        default: 0
    },
    lastClicked: {
        type: Date,
        default: null
    },
    // Status
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    unsubscribedAt: {
        type: Date,
        default: null
    },
    unsubscribeReason: {
        type: String,
        default: null
    },
    // Timestamps
    subscribedAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});
// ✅ Compound index for quick lookups
subscriberSchema.index({ campaignId: 1, email: 1 }, { unique: true });
subscriberSchema.index({ userId: 1, subscribedAt: -1 });
subscriberSchema.index({ campaignId: 1, isActive: 1 });
// ✅ Virtual for days since subscribed
subscriberSchema.virtual('daysSinceSubscribed').get(function () {
    const now = new Date();
    const subscribed = new Date(this.subscribedAt);
    const diff = now - subscribed;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
});
// ✅ Instance method to unsubscribe
subscriberSchema.methods.unsubscribe = async function (reason = null) {
    try {
        this.isActive = false;
        this.unsubscribedAt = new Date();
        this.unsubscribeReason = reason;
        return await this.save();
    }
    catch (error) {
        console.error('❌ Unsubscribe error:', error);
        throw error;
    }
};
// ✅ Instance method to record click
subscriberSchema.methods.recordClick = async function () {
    try {
        this.clicks += 1;
        this.lastClicked = new Date();
        return await this.save();
    }
    catch (error) {
        console.error('❌ Record click error:', error);
        throw error;
    }
};
// ✅ Static method to get active subscribers for campaign
subscriberSchema.statics.getActiveByCampaign = function (campaignId) {
    return this.find({
        campaignId,
        isActive: true
    }).sort({ subscribedAt: -1 });
};
// ✅ Static method to get subscriber count
subscriberSchema.statics.getCountByCampaign = function (campaignId) {
    return this.countDocuments({
        campaignId,
        isActive: true
    });
};
module.exports = mongoose.model('Subscriber', subscriberSchema);
//# sourceMappingURL=Subscriber.js.map