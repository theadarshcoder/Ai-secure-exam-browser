// ─────────────────────────────────────────────────────────
// examRoutes.js — Exam ke saare API routes
// ─────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const examController = require('../controllers/examController');
const telemetryController = require('../controllers/telemetryController');
const inviteController = require('../controllers/inviteController');
const { 
    telemetryLimiter, 
    autosaveLimiter, 
    secureActionLimiter,
    codeExecutionLimiter,
    importLimiter,
    heartbeatLimiter
} = require('../middlewares/rateLimiter');

const { checkQuota, checkFeature } = require('../middlewares/subscriptionMiddleware');
const validate = require('../middleware/validate');
const { startExamSchema, saveProgressSchema, submitExamSchema, exitExamSchema, incidentSchema } = require('../validations/exam.schema');

// ═══════════════════════════════════════════════════════════
//  📊 Telemetry & Diagnostics
// ═══════════════════════════════════════════════════════════

// Log hardware/proctoring errors
router.post('/telemetry/log', verifyToken, telemetryLimiter, telemetryController.logError);

// Proctoring violation log karo (Tab Switch, Face Not Detected, etc.)
router.post('/incident', verifyToken, validate(incidentSchema), telemetryLimiter, examController.logIncident);

// 💓 Heartbeat — Continuous secure client verification
router.post('/heartbeat', verifyToken, heartbeatLimiter, examController.heartbeat);



// ═══════════════════════════════════════════════════════════
//  🧑‍🏫 Mentor / Admin Endpoints (Static Paths)
// ═══════════════════════════════════════════════════════════

// Exam create karo (sirf admin/mentor)
router.post('/create', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), checkQuota('exam'), examController.createExam);

// Mentor ke apne banaye hue exams ki list
router.get('/mentor-list', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), examController.getMentorExams);

// Mentor dashboard ke stats (live students, submissions, flags)
router.get('/mentor-stats', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), examController.getMentorStats);

// Admin ke liye system-wide stats
router.get('/admin-stats', verifyToken, checkRole(['admin']), examController.getAdminStats);

// Legacy endpoint for backward compatibility
router.get('/live-grid', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), examController.getMentorExams);

// 🔗 Import from External Link (LeetCode)
router.post('/import-from-link', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), importLimiter, examController.importQuestionFromLink);


// ═══════════════════════════════════════════════════════════
//  🎓 Student Endpoints (Static Paths)
// ═══════════════════════════════════════════════════════════

// Active (published) exams ki list — Student Dashboard pe dikhta hai
router.get('/active', verifyToken, examController.getActiveExams);

// Exam start karo — naya session banega ya purana resume hoga
router.post('/start', verifyToken, validate(startExamSchema), heartbeatLimiter, examController.startExam);


// ⭐ Live Progress Save — har 30 sec mein auto-call hoga
router.post('/save-progress', verifyToken, validate(saveProgressSchema), autosaveLimiter, examController.saveProgress);

// Exam submit karo — auto-scoring hogi, results milenge
router.post('/submit', verifyToken, validate(submitExamSchema), secureActionLimiter, examController.submitExam);

// Secure exit — pauses exam with a password
router.post('/exit', verifyToken, validate(exitExamSchema), secureActionLimiter, examController.exitExam);

// Student requests help
router.post('/help', verifyToken, examController.requestHelp);


// ═══════════════════════════════════════════════════════════
//  🛠️ Utility & Code Execution
// ═══════════════════════════════════════════════════════════

// 4. Run Code API (Rate Limited to protect Judge0)
router.post('/run-code', verifyToken, codeExecutionLimiter, examController.runCode);

// 5. Run Frontend React Lab API
router.post('/run-frontend', verifyToken, codeExecutionLimiter, examController.runFrontendCode);


// ═══════════════════════════════════════════════════════════
//  🔗 Dynamic Routes (With Suffixes)
// ═══════════════════════════════════════════════════════════

// Mentor/Admin Dynamic Paths
router.put('/update/:id', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), examController.updateExam);
router.put('/:id/publish-results', verifyToken, checkRole(['admin', 'super_mentor']), examController.togglePublishResults);
router.get('/submissions/:examId', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), examController.getExamSubmissions);
router.get('/session-detail/:sessionId', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), examController.getSessionDetail);
router.put('/evaluate/:sessionId', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), examController.evaluateSession);
router.put('/terminate/:sessionId', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), examController.terminateSession);
router.get('/live-monitoring/:id', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), examController.getLiveMonitoringData);
router.get('/mentor/:id', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), examController.getMentorExamById);
router.patch('/:id/status', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), examController.updateExamStatus);
router.post('/import-questions/:id', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), examController.importQuestions);

// Student Dynamic Paths
router.get('/resume/:examId', verifyToken, examController.resumeExam);
router.get('/student-result/:examId', verifyToken, examController.getStudentResult);

// Bulk Invite System Paths
router.post('/:examId/bulk-invite', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), checkQuota('student'), inviteController.bulkInvite);
router.get('/:examId/invites', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), inviteController.getInviteStatus);
router.post('/:examId/resend-invite', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), inviteController.resendInvite);


// ═══════════════════════════════════════════════════════════
//  🚨 Generic / Catch-all Routes (MUST BE AT THE BOTTOM)
// ═══════════════════════════════════════════════════════════

// Exam delete karo
router.delete('/:id', verifyToken, checkRole(['admin', 'super_mentor', 'mentor']), examController.deleteExam);

// Exam details (Generic fetch)
router.get('/:id', verifyToken, examController.getExamById);

module.exports = router;
