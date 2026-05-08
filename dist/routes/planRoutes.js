// backend/src/routes/planRoutes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const planController = require('../controllers/planController');
// ✅ PUBLIC ROUTES (for signup flow)
// These don't require authentication because user hasn't logged in yet
router.post('/select', planController.selectPlan);
router.post('/create-order', planController.createPayPalOrder);
router.post('/capture-order', planController.capturePayPalOrder);
router.get('/check-status', planController.checkPaymentStatus);
// ✅ PROTECTED ROUTES (require authentication)
router.post('/upgrade', authenticate, planController.upgradePlan);
router.get('/my-plan', authenticate, planController.getMyPlan);
router.post('/cancel', authenticate, planController.cancelPlan);
module.exports = router;
//# sourceMappingURL=planRoutes.js.map