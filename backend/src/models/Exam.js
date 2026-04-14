const mongoose = require('mongoose');

// Ek naya schema test cases ke liye
const testCaseSchema = new mongoose.Schema({
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false } // True = Student ko input nahi dikhega
});

const questionSchema = new mongoose.Schema({
    type: { 
        type: String, 
        enum: ['mcq', 'short', 'coding'], 
        required: true 
    },
    questionText: { type: String, required: true },
    marks: { type: Number, default: 5 },

    // MCQ fields
    options: [{ type: String }],
    correctOption: { type: Number },

    // Short answer fields (kept for compatibility)
    expectedAnswer: { type: String },
    maxWords: { type: Number },

    // Coding fields
    language: { type: String, default: 'javascript' },
    initialCode: { type: String },
    testCases: [testCaseSchema]
}, { _id: true });

const examSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'General' },
    duration: { type: Number, required: true },        // minutes
    totalMarks: { type: Number, required: true },
    passingMarks: { type: Number, default: 40 },
    
    questions: [questionSchema],
    
    creator: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    
    status: { 
        type: String, 
        enum: ['draft', 'published'], 
        default: 'draft' 
    },
    
    // Admin toggles this to make results visible to students
    resultsPublished: {
        type: Boolean,
        default: false
    },
    
    scheduledDate: { type: Date, default: Date.now }
}, { timestamps: true });

// ─── INDEXES ─────────────────────────────────────────────
// Creator index is critical for Mentor Dashboards
examSchema.index({ creator: 1, createdAt: -1 });

// Status index helps filter active exams for Students
examSchema.index({ status: 1 });

module.exports = mongoose.model('Exam', examSchema);
