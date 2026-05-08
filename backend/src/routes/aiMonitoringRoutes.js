const express = require('express');
const router = express.Router();
const aiMonitoringController = require('../controllers/aiMonitoringController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

/**
 * @route   GET /api/v1/ai-monitoring/analytics
 * @desc    Get aggregated AI analytics
 * @access  Admin, Super Admin
 */
router.get('/analytics', verifyToken, checkRole(['admin', 'super_admin', 'super_mentor']), aiMonitoringController.getOperationalAnalytics);

/**
 * @route   PATCH /api/v1/ai-monitoring/review-violation
 * @desc    Update review status of a violation (Confirmed/False Positive)
 * @access  Admin, Super Admin
 */
router.patch('/review-violation', verifyToken, checkRole(['admin', 'super_admin', 'super_mentor']), aiMonitoringController.updateViolationReview);

/**
 * @route   POST /api/v1/ai-monitoring/governance/toggle
 * @desc    Toggle AI features at different scopes
 * @access  Admin (Institution), Super Admin (Global/Institution)
 */
router.post('/governance/toggle', verifyToken, checkRole(['admin', 'super_admin', 'super_mentor']), aiMonitoringController.toggleAIFeatures);

module.exports = router;
