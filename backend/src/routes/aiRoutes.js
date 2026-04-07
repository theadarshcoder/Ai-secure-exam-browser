const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

/**
 * @route   POST /api/ai/generate
 * @desc    Generate questions based on syllabus/category
 * @access  Private (Mentor/Admin)
 */
router.post('/generate', verifyToken, checkRole(['mentor', 'admin']), aiController.generateQuestions);

module.exports = router;
