const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const adminController = require('../controllers/adminController');

// ═══════════════════════════════════════════════════════════
//  Admin / Mentor Dashboard APIs
// ═══════════════════════════════════════════════════════════

// Fetch all exam results and sessions
router.get('/results', verifyToken, checkRole(['admin', 'mentor']), adminController.getAllResults);

// Dashboard counters (Live Students, Total Exams, etc.)
router.get('/stats', verifyToken, checkRole(['admin', 'mentor']), adminController.getDashboardStats);

// ─────────────────────────────────────────────────────────
// User Management
// ─────────────────────────────────────────────────────────

// Students CRUD
router.get('/students', verifyToken, checkRole(['admin', 'mentor']), adminController.getAllStudents);
router.delete('/students/:id', verifyToken, checkRole(['admin']), adminController.deleteStudent);

// Mentors CRUD (Admin ONLY)
router.get('/mentors', verifyToken, checkRole(['admin']), adminController.getAllMentors);
router.delete('/mentors/:id', verifyToken, checkRole(['admin']), adminController.deleteMentor);

// ─────────────────────────────────────────────────────────
// System Health & Monitoring
// ─────────────────────────────────────────────────────────

// Global Health Check (DB, Judge0, Live Layer)
router.get('/health', verifyToken, checkRole(['admin']), adminController.getSystemHealth);

// Audit Logs retrieval
router.get('/audit-logs', verifyToken, checkRole(['admin']), adminController.getAuditLogs);

module.exports = router;
