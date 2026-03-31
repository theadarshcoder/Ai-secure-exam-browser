const mongoose = require('mongoose');

// ─── Violation Schema ────────────────────────────────────
// Har ek cheating/proctoring violation ka record
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

// ─── Exam Session Schema ─────────────────────────────────
// Ye har student ka exam attempt track karta hai
// Isme answers, score, violations, aur LIVE PROGRESS sab save hota hai
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
    // Key = question index (string), Value = answer
    // MCQ:    { "0": 2, "1": 0 }           ← selected option index
    // Short:  { "2": "Ye mera answer hai" } ← text response
    // Coding: { "3": "console.log('hi')" }  ← code string
    answers: { type: mongoose.Schema.Types.Mixed, default: {} },
    
    // ─── 🆕 LIVE PROGRESS TRACKING ──────────────────
    // Ye fields tab kaam aati hain jab:
    //   - Student ka internet chala jaye → wapas aaye toh yehi se resume
    //   - Light chali jaye → laptop restart pe sab data wahi se mile
    //   - Browser crash ho jaye → sab kuch safe rahega
    
    currentQuestionIndex: { type: Number, default: 0 },  // Abhi kaunsa question chal raha hai
    
    // Har question ka individual status (answered/skipped/flagged for review)
    questionStates: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
        // Example: { "0": "answered", "1": "skipped", "2": "flagged", "3": "not_visited" }
    },

    // Remaining time in seconds — client har 30 sec mein update karega
    // Isse agar student reconnect kare toh exact remaining time mil jayega
    remainingTimeSeconds: { type: Number, default: null },

    // Kitni baar student ne reconnect kiya (resume count)
    resumeCount: { type: Number, default: 0 },

    // Last save timestamp — client ke liye pata chale ki last sync kab hua
    lastSavedAt: { type: Date, default: Date.now },

    // ─── Score & Results ─────────────────────────────
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    
    // ─── Timing ──────────────────────────────────────
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    
    // ─── Proctoring Data ─────────────────────────────
    violations: [violationSchema],
    tabSwitchCount: { type: Number, default: 0 },
    
    // ─── Session Status ──────────────────────────────
    // in_progress: exam chal raha hai
    // submitted:   student ne submit kar diya
    // flagged:     proctoring system ne flag kiya (suspicious activity)
    // reviewed:    mentor ne manually review kar liya
    // auto_submitted: time khatam hone pe auto-submit hua
    status: { 
        type: String, 
        enum: ['in_progress', 'submitted', 'flagged', 'reviewed', 'auto_submitted'],
        default: 'in_progress' 
    }
}, { timestamps: true });

// Ek student ka ek exam mein sirf EK session ho sakta hai
examSessionSchema.index({ exam: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('ExamSession', examSessionSchema);
