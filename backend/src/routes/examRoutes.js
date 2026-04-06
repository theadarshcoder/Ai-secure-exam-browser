// ─────────────────────────────────────────────────────────
// examRoutes.js — Exam ke saare API routes
// ─────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const { verifyToken, checkRole, checkPermission } = require('../middlewares/authMiddleware');
const examController = require('../controllers/examController');

// ═══════════════════════════════════════════════════════════
//  🧑‍🏫 Mentor / Admin Endpoints
// ═══════════════════════════════════════════════════════════

// Exam create karo (sirf admin/mentor)
router.post('/create', verifyToken, checkRole(['admin', 'mentor']), examController.createExam);

// Mentor ke apne banaye hue exams ki list
router.get('/mentor-list', verifyToken, checkPermission('create_exam'), examController.getMentorExams);

// Mentor dashboard ke stats (live students, submissions, flags)
router.get('/mentor-stats', verifyToken, checkPermission('create_exam'), examController.getMentorStats);

// Kisi specific exam ke saare submissions dekho
router.get('/submissions/:examId', verifyToken, checkPermission('view_live_grid'), examController.getExamSubmissions);

// Admin ke liye system-wide stats
router.get('/admin-stats', verifyToken, checkPermission('manage_users'), examController.getAdminStats);


// ═══════════════════════════════════════════════════════════
//  🎓 Student Endpoints
// ═══════════════════════════════════════════════════════════

// Active (published) exams ki list — Student Dashboard pe dikhta hai
router.get('/active', verifyToken, examController.getActiveExams);

// Exam start karo — naya session banega ya purana resume hoga
router.post('/start', verifyToken, examController.startExam);

// ⭐ Live Progress Save — har 30 sec mein auto-call hoga
// Isse answers, current question, remaining time sab silently save hota hai
router.post('/save-progress', verifyToken, examController.saveProgress);

// Resume endpoint — internet/light wapas aane pe poora state restore karo
router.get('/resume/:examId', verifyToken, examController.resumeExam);

// Exam submit karo — auto-scoring hogi, results milenge
router.post('/submit', verifyToken, examController.submitExam);

// Proctoring violation log karo (Tab Switch, Face Not Detected, etc.)
router.post('/incident', verifyToken, examController.logIncident);

// Exam details (questions without correct answers — security)
router.get('/:id', verifyToken, examController.getExamById);

// Legacy endpoint for backward compatibility
router.get('/live-grid', verifyToken, checkPermission('view_live_grid'), examController.getMentorExams);

// 4. Run Code API
router.post('/run-code', verifyToken, examController.runCode);

module.exports = router;
