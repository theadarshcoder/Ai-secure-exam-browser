const express = require('express');
const router = express.Router();
const { subscribe, createDemoRequest, verifyDemoRequest, setPassword } = require('../controllers/publicController');
const { demoRequestLimiter, demoEmailLimiter } = require('../middlewares/rateLimiter');

// POST /api/public/subscribe
router.post('/subscribe', subscribe);
router.post('/demo-request', demoRequestLimiter, demoEmailLimiter, createDemoRequest);
router.post('/verify-request', verifyDemoRequest);
router.post('/set-password', setPassword);

// 🌐 Public Platform Status (For Banner/Maintenance check)
const platformController = require('../controllers/platformSettingsController');
router.get('/platform/status', platformController.getPublicStatus);

module.exports = router;
