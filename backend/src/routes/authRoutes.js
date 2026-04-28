// ─────────────────────────────────────────────────────────
// authRoutes.js — Authentication ke saare routes
// ─────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const authController = require('../controllers/authController');
const inviteController = require('../controllers/inviteController');

// ─── Public Route (koi bhi access kar sakta hai) ─────────
// POST /api/auth/login — Email + Password se login karo, JWT token milega
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);

// ─── Public Route — Student email link se verify karta hai ──
// POST /api/auth/verify-invite — Token verify → auto-login → exam redirect
router.post('/verify-invite', inviteController.verifyInvite);

// ─── Protected Route (sirf Admin hi access kar sakta hai) ─
// POST /api/auth/register — Admin naye students/mentors create karega
// Step 1: verifyToken check karega ki request mein valid JWT hai
// Step 2: checkRole check karega ki logged-in user 'admin' hai
router.post('/register', verifyToken, checkRole(['admin', 'super_mentor']), authController.register);

// ─── Protected Route (any authenticated user) ───────────
// POST /api/auth/logout — Clear current session token
router.post('/logout', verifyToken, authController.logout);

module.exports = router;
