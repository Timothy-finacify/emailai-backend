const express = require('express')
const router = express.Router()
const promoController = require('../controllers/promoController')
const { authMiddleware } = require('../middleware/auth')

// Public
router.post('/validate', promoController.validatePromo)

// Protected
router.post('/apply', authMiddleware, promoController.applyPromo)
router.get('/active', authMiddleware, promoController.getActivePromo)

// Admin
router.post('/create', authMiddleware, promoController.createPromoCode)
router.put('/deactivate/:code', authMiddleware, promoController.deactivatePromo)
router.get('/all', authMiddleware, promoController.getAllPromos)

module.exports = router