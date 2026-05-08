 // backend/src/controllers/campaignController.js

const Campaign = require('../models/Campaign')
const Subscriber = require('../models/Subscriber')
const ExportLog = require('../models/ExportLog')
const crypto = require('crypto')

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
    const { shareToken } = req.params

    const campaign = await Campaign.findOne({ shareToken })
      .select('id name subject content createdBy subscriberCount viewCount')
      .populate('createdBy', 'name email')

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      })
    }

    // Track views
    campaign.viewCount = (campaign.viewCount || 0) + 1
    await campaign.save()

    res.json({
      success: true,
      data: campaign
    })
  } catch (error) {
    console.error('❌ Get campaign by share token error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching campaign'
    })
  }
}

/**
 * @desc    Add subscriber via share link
 * @route   POST /api/campaigns/share/:shareToken/subscribe
 * @access  Public
 */
exports.addSubscriber = async (req, res) => {
  try {
    const { shareToken } = req.params
    const { name, email, phone, ipAddress, userAgent } = req.body

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      })
    }

    // Find campaign
    const campaign = await Campaign.findOne({ shareToken })
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      })
    }

    // Check if already subscribed
    const existingSubscriber = await Subscriber.findOne({
      campaignId: campaign._id,
      email: email.toLowerCase()
    })

    if (existingSubscriber) {
      return res.status(400).json({
        success: false,
        message: 'This email is already subscribed'
      })
    }

    // Create new subscriber
    const subscriber = await Subscriber.create({
      campaignId: campaign._id,
      userId: campaign.createdBy,
      name: name?.trim() || email.split('@')[0],
      email: email.toLowerCase(),
      phone: phone || null,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      source: 'share_link',
      subscribedAt: new Date()
    })

    // Update campaign subscriber count
    campaign.subscriberCount = (campaign.subscriberCount || 0) + 1
    await campaign.save()

    console.log(`✅ New subscriber: ${email} -> campaign ${campaign._id}`)

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed!',
      data: {
        subscriberId: subscriber._id,
        email: subscriber.email,
        name: subscriber.name
      }
    })
  } catch (error) {
    console.error('❌ Add subscriber error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe'
    })
  }
}

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
    const { campaignId } = req.params
    const userId = req.user._id || req.user.id

    const campaign = await Campaign.findById(campaignId)
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      })
    }

    if (campaign.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to share this campaign'
      })
    }

    // Generate share token if not exists
    if (!campaign.shareToken) {
      campaign.shareToken = crypto.randomBytes(16).toString('hex')
      campaign.shareEnabled = true
      campaign.shareCreatedAt = new Date()
    }
    
    await campaign.save()

    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/share/${campaign.shareToken}`

    res.json({
      success: true,
      data: {
        shareToken: campaign.shareToken,
        shareUrl: shareUrl,
        shareEnabled: campaign.shareEnabled,
        subscriberCount: campaign.subscriberCount || 0
      }
    })
  } catch (error) {
    console.error('❌ Generate share token error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to generate share token'
    })
  }
}

/**
 * @desc    Get campaign subscribers list
 * @route   GET /api/campaigns/:campaignId/subscribers
 * @access  Private
 */
exports.getCampaignSubscribers = async (req, res) => {
  try {
    const { campaignId } = req.params
    const userId = req.user._id || req.user.id

    // Verify ownership
    const campaign = await Campaign.findById(campaignId)
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      })
    }

    if (campaign.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      })
    }

    // Get subscribers
    const subscribers = await Subscriber.find({ campaignId })
      .select('id name email phone subscribedAt source')
      .sort({ subscribedAt: -1 })

    // ✅ Get today's export count
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const exportCountToday = await ExportLog.countDocuments({
      campaignId,
      userId,
      createdAt: { $gte: today }
    })

    res.json({
      success: true,
      data: subscribers,
      count: subscribers.length,
      exportCountToday  // ✅ Included for frontend
    })
  } catch (error) {
    console.error('❌ Get campaign subscribers error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching subscribers'
    })
  }
}

/**
 * @desc    Get campaign with subscribers (detailed)
 * @route   GET /api/campaigns/:campaignId/with-subscribers
 * @access  Private
 */
exports.getCampaignWithSubscribers = async (req, res) => {
  try {
    const { campaignId } = req.params
    const userId = req.user._id || req.user.id

    const campaign = await Campaign.findById(campaignId)
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      })
    }

    if (campaign.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      })
    }

    const subscribers = await Subscriber.find({ campaignId })
      .sort({ subscribedAt: -1 })

    res.json({
      success: true,
      data: {
        campaign: {
          id: campaign._id,
          name: campaign.name,
          subject: campaign.subject,
          subscriberCount: campaign.subscriberCount || subscribers.length,
          shareEnabled: campaign.shareEnabled,
          shareToken: campaign.shareToken
        },
        subscribers: subscribers
      }
    })
  } catch (error) {
    console.error('❌ Get campaign with subscribers error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching campaign'
    })
  }
}

/**
 * @desc    Delete a subscriber
 * @route   DELETE /api/campaigns/:campaignId/subscribers/:subscriberId
 * @access  Private
 */
exports.deleteSubscriber = async (req, res) => {
  try {
    const { campaignId, subscriberId } = req.params
    const userId = req.user._id || req.user.id

    // Verify ownership
    const campaign = await Campaign.findById(campaignId)
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      })
    }

    if (campaign.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      })
    }

    // Find and delete subscriber
    const subscriber = await Subscriber.findOneAndDelete({
      _id: subscriberId,
      campaignId
    })

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Subscriber not found'
      })
    }

    // Update campaign count
    campaign.subscriberCount = Math.max(0, (campaign.subscriberCount || 1) - 1)
    await campaign.save()

    res.json({
      success: true,
      message: 'Subscriber deleted successfully'
    })
  } catch (error) {
    console.error('❌ Delete subscriber error:', error)
    res.status(500).json({
      success: false,
      message: 'Error deleting subscriber'
    })
  }
}

/**
 * @desc    Get today's export count
 * @route   GET /api/campaigns/:campaignId
 */
exports.getExportCount = async (req, res) => {
  try {
    const { campaignId } = req.params
    const userId = req.user._id || req.user.id

    // Verify ownership
    const campaign = await Campaign.findById(campaignId)
    if (!campaign || campaign.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const count = await ExportLog.countDocuments({
      campaignId,
      userId,
      createdAt: { $gte: today }
    })

    res.json({
      success: true,
      count
    })
  } catch (error) {
    console.error('❌ Get export count error:', error)
    res.status(500).json({
      success: false,
      message: 'Error getting export count'
    })
  }
}

/**
 * @desc    Track an export (increment count)
 * @route   POST /api/campaigns/:campaignId/track-export
 * @access  Private
 */
exports.trackExport = async (req, res) => {
  try {
    const { campaignId } = req.params
    const userId = req.user._id || req.user.id

    // Verify ownership
    const campaign = await Campaign.findById(campaignId)
    if (!campaign || campaign.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      })
    }

    // Log the export
    await ExportLog.create({
      campaignId,
      userId,
      exportedAt: new Date()
    })

    res.json({
      success: true,
      message: 'Export tracked'
    })
  } catch (error) {
    console.error('❌ Track export error:', error)
    res.status(500).json({
      success: false,
      message: 'Error tracking export'
    })
  }
}

/**
 * @desc    Export subscribers as CSV
 * @route   GET /api/campaigns/:campaignId/subscribers/export
 * @access  Private
 */
exports.exportSubscribers = async (req, res) => {
  try {
    const { campaignId } = req.params
    const userId = req.user._id || req.user.id

    // Verify ownership
    const campaign = await Campaign.findById(campaignId)
    if (!campaign || campaign.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      })
    }

    // Get subscribers
    const subscribers = await Subscriber.find({ campaignId })
      .sort({ subscribedAt: -1 })

    // Generate CSV
    let csv = 'Name,Email,Phone,Subscribed At,Source\n'
    subscribers.forEach(sub => {
      csv += `"${sub.name || ''}","${sub.email}","${sub.phone || ''}","${sub.subscribedAt?.toISOString() || ''}","${sub.source || 'share_link'}"\n`
    })

    // Track this export
    await ExportLog.create({
      campaignId,
      userId,
      exportedAt: new Date()
    })

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="subscribers-${campaignId}-${Date.now()}.csv"`)
    res.send(csv)

    console.log(`✅ Exported ${subscribers.length} subscribers for campaign ${campaignId}`)
  } catch (error) {
    console.error('❌ Export subscribers error:', error)
    res.status(500).json({
      success: false,
      message: 'Error exporting subscribers'
    })
  }
}

/**
 * @desc    Get campaign analytics
 * @route   GET /api/campaigns/:campaignId/analytics
 * @access  Private
 */
exports.getCampaignAnalytics = async (req, res) => {
  try {
    const { campaignId } = req.params
    const userId = req.user._id || req.user.id

    const campaign = await Campaign.findById(campaignId)
    if (!campaign || campaign.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      })
    }

    const subscribers = await Subscriber.find({ campaignId })
    const totalViews = campaign.viewCount || 0
    const totalSubscribers = subscribers.length

    const conversionRate = totalViews > 0 
      ? ((totalSubscribers / totalViews) * 100).toFixed(2) 
      : 0

    // Subscribers by date (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentSubscribers = subscribers.filter(s => 
      s.subscribedAt >= sevenDaysAgo
    )

    res.json({
      success: true,
      data: {
        totalViews,
        totalSubscribers,
        conversionRate: `${conversionRate}%`,
        shareEnabled: campaign.shareEnabled,
        shareToken: campaign.shareToken,
        sourceBreakdown: {
          shareLink: subscribers.filter(s => s.source === 'share_link').length,
          direct: subscribers.filter(s => s.source === 'direct').length,
          import: subscribers.filter(s => s.source === 'import').length
        },
        recentSubscribers: recentSubscribers.slice(0, 10),
        subscribersByDay: getSubscribersByDay(recentSubscribers)
      }
    })
  } catch (error) {
    console.error('❌ Get analytics error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics'
    })
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getSubscribersByDay(subscribers) {
  const days = {}
  const today = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    days[dateStr] = 0
  }
  
  subscribers.forEach(sub => {
    const dateStr = sub.subscribedAt?.toISOString().split('T')[0]
    if (days[dateStr] !== undefined) {
      days[dateStr]++
    }
  })
  
  return Object.entries(days).map(([date, count]) => ({ date, count }))
}