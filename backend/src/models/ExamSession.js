const mongoose = require('mongoose');

// Tracks every proctoring violation during a session
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

const examSessionSchema = new mongoose.Schema({
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
    
    // Student's responses — key is question index (string), value is the answer
    // For MCQ: stores the selected option index (Number)
    // For Short: stores the text response (String)
    // For Coding: stores the code (String)
    answers: { type: mongoose.Schema.Types.Mixed, default: {} },
    
    // Score calculated on submission
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    
    // Session timing
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    
    // Proctoring data
    violations: [violationSchema],
    tabSwitchCount: { type: Number, default: 0 },
    
    status: { 
        type: String, 
        enum: ['in_progress', 'submitted', 'flagged', 'reviewed'],
        default: 'in_progress' 
    }
}, { timestamps: true });

// Prevent duplicate sessions: one student, one exam
examSessionSchema.index({ exam: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('ExamSession', examSessionSchema);
