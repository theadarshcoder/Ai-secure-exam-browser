// ─────────────────────────────────────────────────────────
// authRoutes.js — Authentication ke saare routes
// ─────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const authController = require('../controllers/authController');
const inviteController = require('../controllers/inviteController');

const validate = require('../middleware/validate');
const { loginSchema, registerSchema, refreshSchema, inviteVerifySchema } = require('../validations/auth.schema');

// ─── Public Route (koi bhi access kar sakta hai) ─────────
// POST /api/auth/login — Email + Password se login karo, JWT token milega
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);

// ─── Public Route — Student email link se verify karta hai ──
// POST /api/auth/verify-invite — Token verify → auto-login → exam redirect
router.post('/verify-invite', validate(inviteVerifySchema), inviteController.verifyInvite);

// ─── Protected Route (sirf Admin hi access kar sakta hai) ─
// POST /api/auth/register — Admin naye students/mentors create karega
router.post('/register', verifyToken, checkRole(['admin', 'super_mentor']), validate(registerSchema), authController.register);

// ─── Protected Route (any authenticated user) ───────────
// POST /api/auth/logout — Clear current session token
router.post('/logout', verifyToken, authController.logout);

module.exports = router;
