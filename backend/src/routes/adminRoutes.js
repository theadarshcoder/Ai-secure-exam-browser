const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const adminController = require('../controllers/adminController');

// ═══════════════════════════════════════════════════════════
//  Admin / Mentor Dashboard APIs
// ═══════════════════════════════════════════════════════════

// Sirf Admin aur Mentor hi results dekh sakte hain
// Frontend Dashboard Table ke liye data yahan se jayega
router.get('/results', verifyToken, checkRole(['admin', 'mentor']), adminController.getAllResults);

// Dashboard ke top "Total Students", "Live Exams" wale counters ke liye
router.get('/stats', verifyToken, checkRole(['admin', 'mentor']), adminController.getDashboardStats);

module.exports = router;
