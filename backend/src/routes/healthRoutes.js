const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const { register, metricsContentType } = require('../utils/metrics');

/**
 * 🏥 Health & Metrics Routes
 */

// 🟢 Public Liveness
router.get('/live', healthController.getLiveness);

// 🟡 Public Readiness (Minimal info for LB)
router.get('/ready', healthController.getReadiness);

// 📁 Private Detailed Health (Admin Only)
router.get('/detailed', verifyToken, checkRole(['admin', 'super_admin']), healthController.getDetailedHealth);

// 📊 Private Metrics (Admin Only)
router.get('/metrics', verifyToken, checkRole(['admin', 'super_admin']), async (req, res) => {
    try {
        res.set('Content-Type', metricsContentType);
        res.end(await register.metrics());
    } catch (err) {
        res.status(500).end(err);
    }
});

module.exports = router;
