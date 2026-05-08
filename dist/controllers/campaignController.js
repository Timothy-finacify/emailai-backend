// backend/src/controllers/campaignController.js
const Campaign = require('../models/Campaign');
const Subscriber = require('../models/Subscriber');
const crypto = require('crypto');
// ============================================
// PUBLIC ROUTES (No Auth Required)
// ============================================
/**
 * @desc    Get campaign by share token (public view)
 * @route   GET /api/campaigns/share/:shareToken
 * @access  Public
 */
exports.getCampaignByShareToken = async (req, res) => {
    try {
        const { shareToken } = req.params;
        // Find campaign with this share token
        const campaign = await Campaign.findOne({ shareToken })
            .select('id name subject content createdBy subscriberCount -password -refreshToken')
            .populate('createdBy', 'name email');
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }
        // Track views (optional - increment viewCount)
        campaign.viewCount = (campaign.viewCount || 0) + 1;
        await campaign.save();
        res.json({
            success: true,
            data: campaign
        });
    }
    catch (error) {
        console.error('❌ Get campaign by share token error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching campaign'
        });
    }
};
/**
 * @desc    Add subscriber via share link
 * @route   POST /api/campaigns/share/:shareToken/subscribe
 * @access  Public
 */
exports.addSubscriber = async (req, res) => {
    try {
        const { shareToken } = req.params;
        const { name, email, phone, ipAddress, userAgent, subscribedAt } = req.body;
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }
        // Find campaign
        const campaign = await Campaign.findOne({ shareToken });
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }
        // Check if subscriber already exists for this campaign
        const existingSubscriber = await Subscriber.findOne({
            campaignId: campaign._id,
            email: email.toLowerCase()
        });
        if (existingSubscriber) {
            return res.status(400).json({
                success: false,
                message: 'This email is already subscribed'
            });
        }
        // Create new subscriber
        const subscriber = await Subscriber.create({
            campaignId: campaign._id,
            userId: campaign.createdBy,
            name: name.trim(),
            email: email.toLowerCase(),
            phone: phone || null,
            ipAddress: ipAddress || 'unknown',
            userAgent: userAgent || 'unknown',
            source: 'share_link',
            subscribedAt: subscribedAt || new Date()
        });
        // Update campaign subscriber count
        campaign.subscriberCount = (campaign.subscriberCount || 0) + 1;
        await campaign.save();
        console.log(`✅ New subscriber added: ${email} to campaign ${campaign._id}`);
        res.status(201).json({
            success: true,
            message: 'Successfully subscribed!',
            data: {
                subscriberId: subscriber._id,
                email: subscriber.email,
                name: subscriber.name
            }
        });
    }
    catch (error) {
        console.error('❌ Add subscriber error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to subscribe'
        });
    }
};
// ============================================
// PRIVATE ROUTES (Auth Required)
// ============================================
/**
 * @desc    Generate share token for campaign
 * @route   POST /api/campaigns/:campaignId/generate-share
 * @access  Private
 */
exports.generateShareToken = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const userId = req.user._id;
        // Find campaign and verify ownership
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }
        if (campaign.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to share this campaign'
            });
        }
        // Generate unique share token if not exists
        if (!campaign.shareToken) {
            campaign.shareToken = crypto.randomBytes(16).toString('hex');
            campaign.shareEnabled = true;
            campaign.shareCreatedAt = new Date();
            await campaign.save();
            console.log(`✅ Share token generated for campaign: ${campaignId}`);
        }
        // Generate shareable URL
        const shareUrl = `${process.env.FRONTEND_URL}/share/${campaign.shareToken}`;
        res.json({
            success: true,
            data: {
                shareToken: campaign.shareToken,
                shareUrl: shareUrl,
                shareEnabled: campaign.shareEnabled,
                subscriberCount: campaign.subscriberCount || 0
            }
        });
    }
    catch (error) {
        console.error('❌ Generate share token error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate share token'
        });
    }
};
/**
 * @desc    Get campaign with subscribers
 * @route   GET /api/campaigns/:campaignId/subscribers
 * @access  Private
 */
exports.getCampaignWithSubscribers = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const userId = req.user._id;
        // Find campaign and verify ownership
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found'
            });
        }
        if (campaign.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        // Get all subscribers for this campaign
        const subscribers = await Subscriber.find({
            campaignId: campaignId
        }).sort({ subscribedAt: -1 });
        res.json({
            success: true,
            data: {
                campaign: {
                    id: campaign._id,
                    name: campaign.name,
                    subject: campaign.subject,
                    subscriberCount: campaign.subscriberCount || subscribers.length
                },
                subscribers: subscribers
            }
        });
    }
    catch (error) {
        console.error('❌ Get campaign with subscribers error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching campaign'
        });
    }
};
/**
 * @desc    Get campaign analytics
 * @route   GET /api/campaigns/:campaignId/analytics
 * @access  Private
 */
exports.getCampaignAnalytics = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const userId = req.user._id;
        // Verify ownership
        const campaign = await Campaign.findById(campaignId);
        if (!campaign || campaign.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        // Get analytics
        const subscribers = await Subscriber.find({ campaignId });
        const totalViews = campaign.viewCount || 0;
        const totalSubscribers = subscribers.length;
        // Calculate engagement (estimated)
        const conversionRate = totalViews > 0 ? ((totalSubscribers / totalViews) * 100).toFixed(2) : 0;
        res.json({
            success: true,
            data: {
                totalViews,
                totalSubscribers,
                conversionRate: `${conversionRate}%`,
                sourceBreakdown: {
                    shareLink: subscribers.filter(s => s.source === 'share_link').length,
                    direct: subscribers.filter(s => s.source === 'direct').length
                },
                recentSubscribers: subscribers.slice(0, 10)
            }
        });
    }
    catch (error) {
        console.error('❌ Get analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching analytics'
        });
    }
};
/**
 * @desc    Export subscribers as CSV
 * @route   GET /api/campaigns/:campaignId/subscribers/export
 * @access  Private
 */
exports.exportSubscribers = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const userId = req.user._id;
        // Verify ownership
        const campaign = await Campaign.findById(campaignId);
        if (!campaign || campaign.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        // Get subscribers
        const subscribers = await Subscriber.find({ campaignId });
        // Generate CSV
        let csv = 'Name,Email,Phone,Subscribed At\n';
        subscribers.forEach(sub => {
            csv += `"${sub.name}","${sub.email}","${sub.phone || ''}","${sub.subscribedAt.toISOString()}"\n`;
        });
        // Send as downloadable file
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="subscribers-${campaignId}.csv"`);
        res.send(csv);
        console.log(`✅ Exported ${subscribers.length} subscribers for campaign ${campaignId}`);
    }
    catch (error) {
        console.error('❌ Export subscribers error:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting subscribers'
        });
    }
};
/**
 * @desc    Delete subscriber
 * @route   DELETE /api/campaigns/:campaignId/subscribers/:subscriberId
 * @access  Private
 */
exports.deleteSubscriber = async (req, res) => {
    try {
        const { campaignId, subscriberId } = req.params;
        const userId = req.user._id;
        // Verify ownership
        const campaign = await Campaign.findById(campaignId);
        if (!campaign || campaign.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        // Delete subscriber
        await Subscriber.findByIdAndDelete(subscriberId);
        // Update count
        campaign.subscriberCount = Math.max(0, (campaign.subscriberCount || 1) - 1);
        await campaign.save();
        res.json({
            success: true,
            message: 'Subscriber deleted'
        });
    }
    catch (error) {
        console.error('❌ Delete subscriber error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting subscriber'
        });
    }
};
//# sourceMappingURL=campaignController.js.map