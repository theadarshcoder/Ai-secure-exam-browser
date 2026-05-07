const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const billingController = require('../controllers/billingController');

// All billing routes are protected and restricted to Admins
router.use(verifyToken, checkRole(['admin']));

// GET /api/billing/status — Usage dashboard info
router.get('/status', billingController.getSubscriptionStatus);

// POST /api/billing/create-checkout — Start upgrade flow
router.post('/create-checkout', billingController.createCheckout);

module.exports = router;
