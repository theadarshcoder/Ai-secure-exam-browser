const mongoose = require('mongoose');

// ─── Exam Invite Schema ──────────────────────────────────
// Tracks each individual invite sent to a student for an exam.
// Supports: device locking, token rotation, status lifecycle.
const ExamInviteSchema = new mongoose.Schema({
    exam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,  // DB-level case normalization (Edge Case Fix #2)
        trim: true
    },

    // Hashed invite token (crypto SHA256) — plain token is NEVER stored
    tokenHash: {
        type: String,
        required: true
    },

    // Token expiry — link invalid after this
    tokenExpiresAt: {
        type: Date,
        required: true
    },

    // ─── Status Lifecycle ────────────────────────────
    // pending   → invite created, queued for email
    // sent      → email delivered successfully
    // opened    → student clicked link & verified (verifyInvite API)
    // exam_started → student started exam (startExam API)
    // completed → student submitted exam (submitExam API)
    // failed    → email delivery failed after retries
    status: {
        type: String,
        enum: ['pending', 'sent', 'opened', 'exam_started', 'completed', 'failed'],
        default: 'pending'
    },

    // ─── Device Fingerprinting (Edge Case Fix #1 & #5) ────
    // SHA256(userAgent + deviceId) — NO IP address
    deviceFingerprint: {
        type: String,
        default: null
    },

    // ─── Timestamps ──────────────────────────────────
    sentAt: { type: Date, default: null },
    openedAt: { type: Date, default: null },

    // Track resend count for admin visibility
    resendCount: { type: Number, default: 0 }
}, { timestamps: true });

// ─── INDEXES ─────────────────────────────────────────────
// Prevent duplicate invites: one invite per student per exam
ExamInviteSchema.index({ exam: 1, email: 1 }, { unique: true });

// Fast token lookups for verify endpoint
ExamInviteSchema.index({ tokenHash: 1 });

module.exports = mongoose.model('ExamInvite', ExamInviteSchema);
