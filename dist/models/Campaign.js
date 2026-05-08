// backend/src/models/Campaign.js
// Add these fields to your existing Campaign model:
// In your campaign schema, add:
{
    // ... existing fields (name, subject, content, etc.)
    // ✅ SHARING FIELDS
    shareToken: {
        type: String,
            unique;
        true,
            sparse;
        true,
            index;
        true,
            select;
        false; // Hide by default for security
    }
    shareEnabled: {
        type: Boolean,
        ;
        false,
            index;
        true;
    }
    shareCreatedAt: {
        type: Date,
        ;
        null;
    }
    viewCount: {
        type: Number,
        ;
        0;
    }
    subscriberCount: {
        type: Number,
        ;
        0,
            index;
        true;
    }
    // Optional: Track share analytics
    shareAnalytics: {
        totalViews: {
            type: Number,
            ;
            0;
        }
        totalClicks: {
            type: Number,
            ;
            0;
        }
        conversionRate: {
            type: Number,
            ;
            0;
        }
        lastViewedAt: {
            type: Date,
            ;
            null;
        }
    }
    // Optional: Allow disabling share link
    shareExpiredAt: {
        type: Date,
        ;
        null;
    }
}
// ✅ Static method to find by share token
campaignSchema.statics.findByShareToken = function (shareToken) {
    return this.findOne({
        shareToken,
        shareEnabled: true,
        $or: [
            { shareExpiredAt: null },
            { shareExpiredAt: { $gt: new Date() } }
        ]
    });
};
// ✅ Instance method to generate share link
campaignSchema.methods.generateShareLink = async function () {
    const crypto = require('crypto');
    if (!this.shareToken) {
        this.shareToken = crypto.randomBytes(16).toString('hex');
        this.shareEnabled = true;
        this.shareCreatedAt = new Date();
        await this.save();
    }
    return {
        token: this.shareToken,
        url: `${process.env.FRONTEND_URL}/share/${this.shareToken}`
    };
};
// ✅ Instance method to disable share link
campaignSchema.methods.disableShare = async function () {
    this.shareEnabled = false;
    this.shareToken = undefined;
    return await this.save();
};
// ✅ Instance method to revoke share link (expires it)
campaignSchema.methods.revokeShare = async function () {
    this.shareExpiredAt = new Date();
    return await this.save();
};
//# sourceMappingURL=Campaign.js.map