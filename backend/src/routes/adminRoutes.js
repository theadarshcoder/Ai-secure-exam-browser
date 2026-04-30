const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const adminController = require('../controllers/adminController');
const studentIntelligenceController = require('../controllers/StudentIntelligenceController');

// ═══════════════════════════════════════════════════════════
//  Admin / Mentor Dashboard APIs
// ═══════════════════════════════════════════════════════════

// Fetch all exam results and sessions
router.get('/results', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), adminController.getAllResults);

// Dashboard counters (Live Students, Total Exams, etc.)
router.get('/stats', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), adminController.getDashboardStats);

// Live Proctoring - Fetch all active sessions
router.get('/live-sessions', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), adminController.getLiveSessions);

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

// Audit Logs retrieval (Restricted to Admins)
router.get('/audit-logs', verifyToken, checkRole(['admin']), adminController.getAuditLogs);
router.delete('/audit-logs/:id', verifyToken, checkRole(['admin']), adminController.deleteAuditLog);
router.delete('/audit-logs', verifyToken, checkRole(['admin']), adminController.clearAuditLogs);

// Intelligence Logs (Platform Trails & Critical Errors)
router.get('/intelligence-logs', verifyToken, checkRole(['admin', 'super_mentor']), adminController.getIntelligenceLogs);
router.delete('/intelligence-logs/:id', verifyToken, checkRole(['admin']), adminController.deleteIntelligenceLog);
router.delete('/intelligence-logs', verifyToken, checkRole(['admin']), adminController.clearIntelligenceLogs);

// ─────────────────────────────────────────────────────────
// Global Settings
// ─────────────────────────────────────────────────────────

router.get('/settings', verifyToken, checkRole(['admin']), adminController.getSettings);
router.post('/settings', verifyToken, checkRole(['admin']), adminController.saveSettings);

// ─────────────────────────────────────────────────────────
// Candidate Identity Verification (eKYC)
// ─────────────────────────────────────────────────────────

router.get('/candidates', verifyToken, checkRole(['admin', 'super_mentor']), adminController.getCandidates);
router.put('/candidates/verify/:userId', verifyToken, checkRole(['admin', 'super_mentor']), adminController.verifyCandidate);
router.put('/candidates/unverify/:userId', verifyToken, checkRole(['admin', 'super_mentor']), adminController.unverifyCandidate);
router.post('/ai-scan', verifyToken, checkRole(['admin', 'super_mentor']), adminController.aiScanCandidates);

// Student Intelligence Report
router.get('/students/:studentId/report', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), studentIntelligenceController.getStudentIntelligence);
router.get('/export/intelligence/:studentId', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), adminController.exportStudentIntelligenceCSV);

// Newsletter / Subscriptions
router.get('/newsletter/subscribers', verifyToken, checkRole(['admin']), adminController.getSubscribers);

module.exports = router;
