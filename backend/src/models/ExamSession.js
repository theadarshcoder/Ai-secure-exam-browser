const mongoose = require('mongoose');

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

// ─── Per-Question Grading Result ─────────────────────────
// Stores the evaluation outcome for each individual question
const questionResultSchema = new mongoose.Schema({
    questionIndex: { type: Number, required: true },
    type: { type: String, enum: ['mcq', 'short', 'coding'] },
    marksObtained: { type: Number, default: 0 },
    maxMarks: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['correct', 'incorrect', 'partial', 'pending_review', 'manually_graded'],
        default: 'pending_review'
    },
    // For MCQ: What student chose vs correct
    studentChoice: { type: mongoose.Schema.Types.Mixed, default: null },
    correctChoice: { type: mongoose.Schema.Types.Mixed, default: null },
    // For Coding: Test case results
    testCaseResults: [{
        testCaseIndex: { type: Number },
        passed: { type: Boolean },
        input: { type: String, default: '' },
        expectedOutput: { type: String, default: '' },
        actualOutput: { type: String, default: '' },
        error: { type: String, default: '' }
    }],
    // For Short Answer: AI + Mentor grading
    aiSuggestedMarks: { type: Number, default: null },
    aiReasoning: { type: String, default: '' },
    mentorFeedback: { type: String, default: '' },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    gradedAt: { type: Date }
}, { _id: false });

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
    
    // ─── Student's Answers ───────────────────────────
    // Key: Question index (string); Value: Student's response
    // MCQ:    { "0": 2, "1": 0 }           ← Index of the selected option
    // Short:  { "2": "This is my answer" } ← Plain text response
    // Coding: { "3": "console.log('hi')" }  ← Submitted code string
    answers: { type: mongoose.Schema.Types.Mixed, default: {} },
    
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

    // ─── 🆕 Per-Question Grading ─────────────────────
    questionResults: [questionResultSchema],
    requiresManualGrading: { type: Boolean, default: false },
    
    // ─── Timing ──────────────────────────────────────
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    
    // ─── Proctoring Data ─────────────────────────────
    violations: [violationSchema],
    tabSwitchCount: { type: Number, default: 0 },
    
    // ─── Session Status ──────────────────────────────
    // in_progress:    Exam currently being taken
    // submitted:      Exam fully graded and finalized
    // pending_review: Auto-graded but short answers need mentor evaluation
    // flagged:        System-flagged due to suspicious activity (multiple violations)
    // reviewed:       Manually reviewed and approved by a mentor
    // auto_submitted: Submitted automatically upon timer expiration
    status: { 
        type: String, 
        enum: ['in_progress', 'submitted', 'pending_review', 'flagged', 'reviewed', 'auto_submitted'],
        default: 'in_progress' 
    }
}, { timestamps: true });

// Ensure only one exam session exists per student per exam
examSessionSchema.index({ exam: 1, student: 1 }, { unique: true });

// Status index for dashboard counts (in_progress vs submitted)
examSessionSchema.index({ status: 1 });

// startedAt index for recent activity sorting
examSessionSchema.index({ startedAt: -1 });

module.exports = mongoose.model('ExamSession', examSessionSchema);
