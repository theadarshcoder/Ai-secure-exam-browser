// ─────────────────────────────────────────────────────────
// examRoutes.js — Exam ke saare API routes
// ─────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const examController = require('../controllers/examController');
const telemetryController = require('../controllers/telemetryController');
const inviteController = require('../controllers/inviteController');
const { codeExecutionLimiter, telemetryLimiter, importLimiter, autosaveLimiter, secureActionLimiter } = require('../middlewares/rateLimiter');

// ═══════════════════════════════════════════════════════════
//  📊 Telemetry & Diagnostics
// ═══════════════════════════════════════════════════════════

// Log hardware/proctoring errors
router.post('/telemetry/log', verifyToken, telemetryLimiter, telemetryController.logError);

// ═══════════════════════════════════════════════════════════
//  🧑‍🏫 Mentor / Admin Endpoints
// ═══════════════════════════════════════════════════════════

// Exam create karo (sirf admin/mentor)
router.post('/create', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), examController.createExam);

// Exam update karo (draft -> publish ya details edit)
router.put('/update/:id', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), examController.updateExam);

// Change results visibility
router.put('/:id/publish-results', verifyToken, checkRole(['admin', 'super_mentor']), examController.togglePublishResults);

// Exam delete karo
router.delete('/:id', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), examController.deleteExam);

// Mentor ke apne banaye hue exams ki list
router.get('/mentor-list', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), examController.getMentorExams);

// Mentor dashboard ke stats (live students, submissions, flags)
router.get('/mentor-stats', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), examController.getMentorStats);

// Kisi specific exam ke saare submissions dekho
router.get('/submissions/:examId', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), examController.getExamSubmissions);

// Admin ke liye system-wide stats
router.get('/admin-stats', verifyToken, checkRole(['admin']), examController.getAdminStats);


const validate = require('../middleware/validate');
const { startExamSchema, saveProgressSchema, submitExamSchema, exitExamSchema, incidentSchema } = require('../validations/exam.schema');

// ═══════════════════════════════════════════════════════════
//  🎓 Student Endpoints
// ═══════════════════════════════════════════════════════════

// Active (published) exams ki list — Student Dashboard pe dikhta hai
router.get('/active', verifyToken, examController.getActiveExams);

// Exam start karo — naya session banega ya purana resume hoga
router.post('/start', verifyToken, validate(startExamSchema), secureActionLimiter, examController.startExam);

// ⭐ Live Progress Save — har 30 sec mein auto-call hoga
// Isse answers, current question, remaining time sab silently save hota hai
router.post('/save-progress', verifyToken, validate(saveProgressSchema), autosaveLimiter, examController.saveProgress);

// Resume endpoint — internet/light wapas aane pe poora state restore karo
router.get('/resume/:examId', verifyToken, examController.resumeExam);

// Exam submit karo — auto-scoring hogi, results milenge
router.post('/submit', verifyToken, validate(submitExamSchema), secureActionLimiter, examController.submitExam);

// Secure exit — pauses exam with a password
router.post('/exit', verifyToken, validate(exitExamSchema), secureActionLimiter, examController.exitExam);

// 🆕 Student Result — Student view of their own performance breakdown
router.get('/student-result/:examId', verifyToken, examController.getStudentResult);

// 🆕 Session Detail — Mentor/Admin full view of a submission with per-question grading
router.get('/session-detail/:sessionId', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), examController.getSessionDetail);

// 🆕 Evaluate Session — Mentor manually grades short answers
router.put('/evaluate/:sessionId', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), examController.evaluateSession);

// 🆕 Terminate Session — Mentor/Admin forcibly ends an exam
router.put('/terminate/:sessionId', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), examController.terminateSession);

// Proctoring violation log karo (Tab Switch, Face Not Detected, etc.)
router.post('/incident', verifyToken, validate(incidentSchema), examController.logIncident);

// 💓 Heartbeat — Continuous secure client verification
router.post('/heartbeat', verifyToken, secureActionLimiter, examController.heartbeat);

// Student requests help
router.post('/help', verifyToken, examController.requestHelp);

// 🔍 Live Monitoring — Admin view of all active sessions
router.get('/live-monitoring/:id', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), examController.getLiveMonitoringData);

// Exam details (questions without correct answers — security)
router.get('/mentor/:id', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), examController.getMentorExamById);
router.patch('/:id/status', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), examController.updateExamStatus);
router.post('/import-questions/:id', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), examController.importQuestions);

// 🔗 Import from External Link (LeetCode/CodeChef)
router.post('/import-from-link', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), importLimiter, examController.importQuestionFromLink);

// Legacy endpoint for backward compatibility (MOVED UP to prevent shadowing by :id)
router.get('/live-grid', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), examController.getMentorExams);

router.get('/:id', verifyToken, examController.getExamById);

// 4. Run Code API (Rate Limited to protect Judge0)
router.post('/run-code', verifyToken, codeExecutionLimiter, examController.runCode);

// 5. Run Frontend React Lab API
router.post('/run-frontend', verifyToken, codeExecutionLimiter, examController.runFrontendCode);

// ═══════════════════════════════════════════════════════════
//  📨 Bulk Invite System
// ═══════════════════════════════════════════════════════════

// Bulk invite students to an exam (CSV upload)
router.post('/:examId/bulk-invite', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), inviteController.bulkInvite);

// Get invite status for an exam
router.get('/:examId/invites', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), inviteController.getInviteStatus);

// Resend invite with new token (token rotation)
router.post('/:examId/resend-invite', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), inviteController.resendInvite);

module.exports = router;
