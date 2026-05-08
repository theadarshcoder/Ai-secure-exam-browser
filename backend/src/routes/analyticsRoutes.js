const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

/**
 * @route   GET /api/v1/analytics/strategic
 * @desc    Get macro-level institutional intelligence
 * @access  Admin, Super Admin
 */
router.get('/strategic', verifyToken, checkRole(['admin', 'super_admin', 'super_mentor']), analyticsController.getStrategicAnalytics);

module.exports = router;
