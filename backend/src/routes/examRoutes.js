// ─────────────────────────────────────────────────────────
// examRoutes.js — Exam ke saare API routes
// ─────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const examController = require('../controllers/examController');

// ═══════════════════════════════════════════════════════════
//  🧑‍🏫 Mentor / Admin Endpoints
// ═══════════════════════════════════════════════════════════

// Exam create karo (sirf admin/mentor)
router.post('/create', verifyToken, checkRole(['admin', 'mentor']), examController.createExam);

// Exam update karo (draft -> publish ya details edit)
router.put('/update/:id', verifyToken, checkRole(['admin', 'mentor']), examController.updateExam);

// Exam delete karo
router.delete('/:id', verifyToken, checkRole(['admin', 'mentor']), examController.deleteExam);

// Mentor ke apne banaye hue exams ki list
router.get('/mentor-list', verifyToken, checkRole(['mentor', 'admin']), examController.getMentorExams);

// Mentor dashboard ke stats (live students, submissions, flags)
router.get('/mentor-stats', verifyToken, checkRole(['mentor', 'admin']), examController.getMentorStats);

// Kisi specific exam ke saare submissions dekho
router.get('/submissions/:examId', verifyToken, checkRole(['mentor', 'admin']), examController.getExamSubmissions);

// Admin ke liye system-wide stats
router.get('/admin-stats', verifyToken, checkRole(['admin']), examController.getAdminStats);


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

// 🆕 Session Detail — Mentor/Admin full view of a submission with per-question grading
router.get('/session-detail/:sessionId', verifyToken, checkRole(['mentor', 'admin']), examController.getSessionDetail);

// 🆕 Evaluate Session — Mentor manually grades short answers
router.put('/evaluate/:sessionId', verifyToken, checkRole(['mentor', 'admin']), examController.evaluateSession);

// Proctoring violation log karo (Tab Switch, Face Not Detected, etc.)
router.post('/incident', verifyToken, examController.logIncident);

// Student requests help
router.post('/help', verifyToken, examController.requestHelp);

// Exam details (questions without correct answers — security)
router.get('/mentor/:id', verifyToken, checkRole(['mentor', 'admin']), examController.getMentorExamById);
router.patch('/:id/status', verifyToken, checkRole(['mentor', 'admin']), examController.updateExamStatus);

router.get('/:id', verifyToken, examController.getExamById);

// Legacy endpoint for backward compatibility
router.get('/live-grid', verifyToken, checkRole(['mentor', 'admin']), examController.getMentorExams);

// 4. Run Code API
router.post('/run-code', verifyToken, examController.runCode);

module.exports = router;
