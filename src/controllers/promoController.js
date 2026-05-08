// ============================================
// FILE: backend/controllers/promoController.js
// ============================================
const PromoCode = require('../models/PromoCode')
const User = require('../models/User')

// ============================================
// APPLY PROMO CODE TO A USER
// POST /api/promo/apply
// ============================================
exports.applyPromo = async (req, res) => {
  try {
    const { userId, code } = req.body

    if (!userId || !code) {
      return res.status(400).json({
        success: false,
        message: 'User ID and promo code are required'
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    if (user.promo && user.promo.code && user.hasActivePromo()) {
      return res.status(400).json({
        success: false,
        message: `You already have an active promo code (${user.promo.code})`
      })
    }

    const promoCode = await PromoCode.findOne({
      code: code.toUpperCase(),
      isActive: true
    })

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired promo code'
      })
    }

    if (!promoCode.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'This promo code has expired or reached its usage limit'
      })
    }

    const appliedAt = new Date()
    const discountExpiresAt = new Date()
    discountExpiresAt.setMonth(discountExpiresAt.getMonth() + promoCode.durationMonths)

    user.promo = {
      code: promoCode.code,
      discountPercent: promoCode.discountPercent,
      durationMonths: promoCode.durationMonths,
      appliedAt: appliedAt,
      discountExpiresAt: discountExpiresAt
    }

    await user.save()
    await promoCode.incrementUsage()

    res.status(200).json({
      success: true,
      message: `Promo code applied! You get ${promoCode.discountPercent}% off for ${promoCode.durationMonths} months.`,
      data: {
        code: promoCode.code,
        discountPercent: promoCode.discountPercent,
        durationMonths: promoCode.durationMonths,
        discountExpiresAt: discountExpiresAt
      }
    })

  } catch (error) {
    console.error('❌ Apply Promo Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to apply promo code'
    })
  }
}

// ============================================
// VALIDATE A PROMO CODE (CHECK ONLY)
// POST /api/promo/validate
// ============================================
exports.validatePromo = async (req, res) => {
  try {
    const { code } = req.body

    if (!code) {
      return res.status(400).json({
        valid: false,
        message: 'Promo code is required'
      })
    }

    const promoCode = await PromoCode.findOne({
      code: code.toUpperCase(),
      isActive: true
    })

    if (!promoCode) {
      return res.status(404).json({
        valid: false,
        message: 'Invalid promo code'
      })
    }

    if (!promoCode.isValid()) {
      return res.status(400).json({
        valid: false,
        message: 'This promo code has expired or reached its usage limit'
      })
    }

    res.status(200).json({
      valid: true,
      discountPercent: promoCode.discountPercent,
      durationMonths: promoCode.durationMonths,
      message: `Valid! ${promoCode.discountPercent}% off for ${promoCode.durationMonths} months.`
    })

  } catch (error) {
    console.error('❌ Validate Promo Error:', error)
    res.status(500).json({
      valid: false,
      message: 'Failed to validate promo code'
    })
  }
}

// ============================================
// GET USER'S ACTIVE PROMO
// GET /api/promo/active
// ============================================
exports.getActivePromo = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    if (!user.promo || !user.promo.code) {
      return res.status(200).json({
        success: true,
        promo: null
      })
    }

    if (!user.hasActivePromo()) {
      return res.status(200).json({
        success: true,
        promo: null,
        message: 'Your promo has expired'
      })
    }

    res.status(200).json({
      success: true,
      promo: {
        code: user.promo.code,
        discountPercent: user.promo.discountPercent,
        durationMonths: user.promo.durationMonths,
        appliedAt: user.promo.appliedAt,
        discountExpiresAt: user.promo.discountExpiresAt
      }
    })

  } catch (error) {
    console.error('❌ Get Active Promo Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get promo'
    })
  }
}

// ============================================
// CREATE A PROMO CODE (ADMIN ONLY)
// POST /api/promo/create
// ============================================
exports.createPromoCode = async (req, res) => {
  try {
    const { code, description, discountPercent, durationMonths, maxUses, validUntil } = req.body

    if (!code || !discountPercent || !validUntil) {
      return res.status(400).json({
        success: false,
        message: 'Code, discount percent, and expiry date are required'
      })
    }

    const existing = await PromoCode.findOne({ code: code.toUpperCase() })
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This promo code already exists'
      })
    }

    const promoCode = await PromoCode.create({
      code: code.toUpperCase(),
      description: description || '',
      discountPercent,
      durationMonths: durationMonths || 3,
      maxUses: maxUses || 500000,
      validUntil: new Date(validUntil),
      createdBy: req.user._id
    })

    res.status(201).json({
      success: true,
      message: 'Promo code created successfully',
      data: promoCode
    })

  } catch (error) {
    console.error('❌ Create Promo Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create promo code'
    })
  }
}

// ============================================
// DEACTIVATE A PROMO CODE (ADMIN ONLY)
// PUT /api/promo/deactivate/:code
// ============================================
exports.deactivatePromo = async (req, res) => {
  try {
    const { code } = req.params

    const promoCode = await PromoCode.findOne({ code: code.toUpperCase() })
    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: 'Promo code not found'
      })
    }

    promoCode.isActive = false
    await promoCode.save()

    res.status(200).json({
      success: true,
      message: `Promo code ${promoCode.code} has been deactivated`
    })

  } catch (error) {
    console.error('❌ Deactivate Promo Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate promo code'
    })
  }
}

// ============================================
// GET ALL PROMO CODES (ADMIN ONLY)
// GET /api/promo/all
// ============================================
exports.getAllPromos = async (req, res) => {
  try {
    const promos = await PromoCode.find().sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: promos.length,
      data: promos
    })

  } catch (error) {
    console.error('❌ Get All Promos Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get promo codes'
    })
  }
}