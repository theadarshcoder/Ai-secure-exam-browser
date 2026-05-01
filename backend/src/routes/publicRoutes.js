const express = require('express');
const router = express.Router();
const { subscribe } = require('../controllers/publicController');

// POST /api/public/subscribe
router.post('/subscribe', subscribe);

module.exports = router;
