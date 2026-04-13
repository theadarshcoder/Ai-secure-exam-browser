const mongoose = require('mongoose');

// ─── Exam Answer Schema ──────────────────────────────────────
// Stores individual question responses to avoid hitting MongoDB's 
// 16MB document limit on the ExamSession object.
const examAnswerSchema = new mongoose.Schema({
    sessionId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'ExamSession', 
        required: true,
        index: true 
    },
    questionId: { 
        type: String, // String ID from the Exam model's questions array
        required: true,
        index: true 
    },
    
    // Student's response
    // For MCQ: selected option index (Number)
    // For Short: answer text (String)
    // For Coding: source code (String)
    answer: { type: mongoose.Schema.Types.Mixed },
    code: { type: String }, // Specifically for coding questions
    
    // Evaluation Result (Populated after submission/grading)
    marksObtained: { type: Number, default: 0 },
    maxMarks: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['correct', 'incorrect', 'partial', 'pending_review', 'manually_graded', 'not_answered'],
        default: 'pending_review'
    },
    
    // Detail result (MCQ choices, test case results, AI feedback)
    result: { type: mongoose.Schema.Types.Mixed },
    
    // Metadata
    lastSavedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// 🛡️ Guardrail 1: sessionId + questionId must be unique to prevent duplicates
examAnswerSchema.index({ sessionId: 1, questionId: 1 }, { unique: true });

// Index for mentor detail views
examAnswerSchema.index({ sessionId: 1 });

module.exports = mongoose.model('ExamAnswer', examAnswerSchema);
