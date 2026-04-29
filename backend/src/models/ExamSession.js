const mongoose = require('mongoose');

// ─── Help Request Schema ──────────────────────────────────
// Record of student help requests during exam
const helpRequestSchema = new mongoose.Schema({
    questionId: { type: String, default: '' },
    message: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: true });

// ─── Violation Schema ────────────────────────────────────
// Record of each individual proctoring/cheating violation
const violationSchema = new mongoose.Schema({
    type: { type: String, required: true },       // 'Tab Switch', 'Face Not Detected', etc.
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    details: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now }
}, { _id: true });

// questionResultSchema removed — now managed by ExamAnswer model

// ─── Exam Session Schema ─────────────────────────────────
// Tracks every individual exam attempt by a student.
// Includes answers, scoring, violation logs, and LIVE PROGRESS snapshots.
const examSessionSchema = new mongoose.Schema({
    // ─── Core References ─────────────────────────────
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
    
    // Student's Answers — 🆕 Moved to ExamAnswer collection
    // answers: { type: mongoose.Schema.Types.Mixed, default: {} },
    
    // ─── 🆕 LIVE PROGRESS TRACKING ──────────────────
    // These fields are crucial for session persistence in case of:
    //   - Internet disconnection (Resume from where you left off)
    //   - System restart or power failure
    //   - Browser or application crashes
    
    currentQuestionIndex: { type: Number, default: 0 },  // Index of the current question being viewed
    
    // Track individual state of each question (answered/skipped/flagged for review)
    questionStates: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
        // Example: { "0": "answered", "1": "skipped", "2": "flagged", "3": "not_visited" }
    },

    // Remaining time in seconds — synchronized with the client every 30 seconds.
    // This allows exact time restoration upon reconnection.
    remainingTimeSeconds: { type: Number, default: null },

    // Counter for how many times the student has reconnected (resume count)
    resumeCount: { type: Number, default: 0 },

    // Timestamp for the last successful synchronization with the client.
    lastSavedAt: { type: Date, default: Date.now },

    // ─── Score & Results ─────────────────────────────
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },

    // ─── 🆕 Per-Question Grading — 🆕 Moved to ExamAnswer collection
    // questionResults: [questionResultSchema],
    requiresManualGrading: { type: Boolean, default: false },
    
    // ─── Timing ──────────────────────────────────────
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    
    // ─── Proctoring Data ─────────────────────────────
    violations: [violationSchema],
    helpRequests: [helpRequestSchema],
    tabSwitchCount: { type: Number, default: 0 },
    snapshots: [{
        url: String,
        timestamp: { type: Date, default: Date.now },
        type: { type: String, enum: ['violation', 'random', 'id_verify'] }
    }],
    
    // Session Status ──────────────────────────────
    // in_progress:    Exam currently being taken
    // submitted:      Exam fully graded and finalized
    // pending_review: Auto-graded but short answers need mentor evaluation
    // flagged:        System-flagged due to suspicious activity (multiple violations)
    // blocked:        Hard locked out of the exam by the system or supervisor
    // reviewed:       Manually reviewed and approved by a mentor
    // auto_submitted: Submitted automatically upon timer expiration
    status: { 
        type: String, 
        enum: ['in_progress', 'submitted', 'pending_review', 'flagged', 'blocked', 'reviewed', 'auto_submitted'],
        default: 'in_progress' 
    },
    
    // ─── Security & Auto-Blocking ────────────────────
    isBlocked: { type: Boolean, default: false },
    blockReason: { type: String, default: '' },
    // 🏎️ Fix 40: Pre-calculated Risk Score (Save CPU during monitoring)
    riskScore: { type: Number, default: 0 },
    riskLevel: { 
        type: String, 
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'LOW'
    },
    
    // ─── 🛡️ Zero-Trust Telemetry Tracking ────────────
    lastHeartbeat: { type: Date },
    heartbeatCount: { type: Number, default: 0 },
    maxHeartbeatGap: { type: Number, default: 0 }, // Largest gap between heartbeats in ms
    
    // 🏎️ Fix 9: Monotonic sequence for ordering
    lastSeq: { type: Number, default: 0 },

    // ─── 🆕 Enterprise Secure Client Meta ───────────
    secureMeta: {
        isSecureClient: { type: Boolean, default: false },
        verifiedAt: { type: Date },
        client: { type: String, default: '' },
        userAgent: { type: String, default: '' },
        sessionHash: { type: String, default: '' },
        baselineFingerprint: { type: String, default: '' }
    }
}, { timestamps: true });

// Ensure only one exam session exists per student per exam
examSessionSchema.index({ exam: 1, student: 1 }, { unique: true });

// Status index for dashboard counts (in_progress vs submitted)
examSessionSchema.index({ status: 1 });

// 🏎️ Fix 30: Critical performance indexes for live exams
// Prevents full collection scans during time extensions and room broadcasts
examSessionSchema.index({ exam: 1, status: 1 });

// unique session per student per exam (already exists but re-ensuring)
examSessionSchema.index({ student: 1, exam: 1 }, { unique: true });

// startedAt index for recent activity sorting
examSessionSchema.index({ startedAt: -1 });

// Composite index for student dashboard queries
examSessionSchema.index({ student: 1, status: 1 });

module.exports = mongoose.model('ExamSession', examSessionSchema);
