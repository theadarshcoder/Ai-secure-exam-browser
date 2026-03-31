const express = require('express');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');
const examController = require('../controllers/examController');
const router = express.Router();

// ─── Mentor / Admin endpoints ───
router.post('/create', verifyToken, checkPermission('create_exam'), examController.createExam);
router.get('/mentor-list', verifyToken, checkPermission('create_exam'), examController.getMentorExams);
router.get('/mentor-stats', verifyToken, checkPermission('create_exam'), examController.getMentorStats);
router.get('/submissions/:examId', verifyToken, checkPermission('view_live_grid'), examController.getExamSubmissions);
router.get('/admin-stats', verifyToken, checkPermission('manage_users'), examController.getAdminStats);

// ─── Student endpoints ───
router.get('/active', verifyToken, examController.getActiveExams);
router.get('/:id', verifyToken, examController.getExamById);
router.post('/start', verifyToken, examController.startExam);
router.post('/submit', verifyToken, examController.submitExam);
router.post('/incident', verifyToken, examController.logIncident);

// Keep legacy endpoint for backward compatibility
router.get('/live-grid', verifyToken, checkPermission('view_live_grid'), examController.getMentorExams);

module.exports = router;
