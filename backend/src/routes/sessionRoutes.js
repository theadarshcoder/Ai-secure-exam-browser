// ─────────────────────────────────────────────────────────
// sessionRoutes.js — Exam Session & Violation Routes
// ─────────────────────────────────────────────────────────
// Ye routes violations (cheating attempts) manage karte hain

const express = require('express');
const router = express.Router();
const { verifyToken, checkRole, checkPermission } = require('../middlewares/authMiddleware');
const sessionController = require('../controllers/sessionController');

// ═══════════════════════════════════════════════════════════
//  🚨 Student Endpoint — Violation Log karo
// ═══════════════════════════════════════════════════════════
// POST /api/session/violation
// Frontend (TabVisibility.jsx) har tab switch pe ye call karega
// Body: { examId, type: "Tab Switch", severity: "medium", details: "..." }
router.post('/violation', verifyToken, sessionController.logViolation);

// ═══════════════════════════════════════════════════════════
//  📋 Admin/Mentor Endpoints — Violation History
// ═══════════════════════════════════════════════════════════

// GET /api/session/violations/:examId/:studentId
// Admin/Mentor kisi specific student ka pura violation report dekhe
// Example: "Rahul ne 10 baar tab switch ki, 3 baar copy paste kiya"
router.get('/violations/:examId/:studentId', 
    verifyToken, 
    checkRole(['admin', 'mentor']), 
    sessionController.getViolationHistory
);

// GET /api/session/flagged/:examId
// Ek exam ke saare suspicious students ki list
// Dashboard pe red flags ke saath dikhega
router.get('/flagged/:examId', 
    verifyToken, 
    checkRole(['admin', 'mentor']), 
    sessionController.getFlaggedStudents
);

module.exports = router;
