const mongoose = require('mongoose');

// Individual question schema — supports MCQ, Short Answer, and Coding
const questionSchema = new mongoose.Schema({
    type: { 
        type: String, 
        enum: ['mcq', 'short', 'coding'], 
        required: true 
    },
    text: { type: String, required: true },
    marks: { type: Number, default: 1 },

    // MCQ fields
    options: [{ type: String }],
    correctIndex: { type: Number },

    // Short answer fields
    expectedAnswer: { type: String },
    maxWords: { type: Number },

    // Coding fields
    language: { type: String },
    starterCode: { type: String },
    testCases: [{
        input: { type: String },
        output: { type: String }
    }]
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
        default: 'published' 
    },
    
    scheduledDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
