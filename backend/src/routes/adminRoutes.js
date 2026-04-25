const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const adminController = require('../controllers/adminController');
const studentIntelligenceController = require('../controllers/StudentIntelligenceController');

// ═══════════════════════════════════════════════════════════
//  Admin / Mentor Dashboard APIs
// ═══════════════════════════════════════════════════════════

// Fetch all exam results and sessions
router.get('/results', verifyToken, checkRole(['admin', 'mentor']), adminController.getAllResults);

// Dashboard counters (Live Students, Total Exams, etc.)
router.get('/stats', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), adminController.getDashboardStats);

// Live Proctoring - Fetch all active sessions
router.get('/live-sessions', verifyToken, checkRole(['admin', 'mentor']), adminController.getLiveSessions);

// Extend live exam time for all students
router.post('/extend-time', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), adminController.extendExamTime);

// ─────────────────────────────────────────────────────────
// User Management
// ─────────────────────────────────────────────────────────

// Students CRUD
router.get('/students', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), adminController.getAllStudents);
router.delete('/students/:id', verifyToken, checkRole(['admin', 'super_mentor']), adminController.deleteStudent);

// Bulk Operations
router.post('/bulk-import', verifyToken, checkRole(['admin', 'super_mentor']), adminController.bulkImportUsers);
router.post('/students/bulk-delete', verifyToken, checkRole(['admin']), adminController.bulkDeleteUsers);

// Mentors CRUD (Admin ONLY)
router.get('/mentors', verifyToken, checkRole(['admin']), adminController.getAllMentors);
router.get('/admins', verifyToken, checkRole(['admin']), adminController.getAllAdmins);
router.delete('/mentors/:id', verifyToken, checkRole(['admin']), adminController.deleteMentor);

// ─────────────────────────────────────────────────────────
// System Health & Monitoring
// ─────────────────────────────────────────────────────────

// Global Health Check (DB, Judge0, Live Layer)
router.get('/health', verifyToken, checkRole(['admin', 'super_mentor']), adminController.getSystemHealth);

// Audit Logs retrieval
router.get('/audit-logs', verifyToken, checkRole(['admin', 'super_mentor']), adminController.getAuditLogs);
router.delete('/audit-logs/:id', verifyToken, checkRole(['admin']), adminController.deleteAuditLog);
router.delete('/audit-logs', verifyToken, checkRole(['admin']), adminController.clearAuditLogs);

// ─────────────────────────────────────────────────────────
// Global Settings
// ─────────────────────────────────────────────────────────

router.get('/settings', verifyToken, checkRole(['admin', 'super_mentor']), adminController.getSettings);
router.post('/settings', verifyToken, checkRole(['admin', 'super_mentor']), adminController.saveSettings);

// ─────────────────────────────────────────────────────────
// Candidate Identity Verification (eKYC)
// ─────────────────────────────────────────────────────────

router.get('/candidates', verifyToken, checkRole(['admin', 'super_mentor']), adminController.getCandidates);
router.put('/candidates/verify/:userId', verifyToken, checkRole(['admin', 'super_mentor']), adminController.verifyCandidate);
router.put('/candidates/unverify/:userId', verifyToken, checkRole(['admin', 'super_mentor']), adminController.unverifyCandidate);

// Student Intelligence Report
router.get('/students/:studentId/report', verifyToken, checkRole(['admin', 'mentor']), studentIntelligenceController.getStudentIntelligence);

module.exports = router;
