const express = require('express');
const router = express.Router();
const { subscribe, createDemoRequest } = require('../controllers/publicController');

// POST /api/public/subscribe
router.post('/subscribe', subscribe);
router.post('/demo-request', createDemoRequest);

module.exports = router;
