const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true }, // Short identifier, e.g., 'ABC'
    domain: { type: String, required: true, unique: true }, // Official domain
    plan: { 
        type: String, 
        enum: ['trial', 'free', 'basic', 'pro', 'enterprise'], 
        default: 'trial' 
    },
    status: { 
        type: String, 
        enum: ['pending', 'active', 'suspended', 'deactivated'], 
        default: 'active' 
    },
    // SaaS Limits
    maxStudents: { type: Number, default: 200 },
    maxMentors: { type: Number, default: 10 },
    maxExams: { type: Number, default: 50 },
    maxConcurrentStudents: { type: Number, default: 100 },
    // Subscription Details
    features: [{ type: String }],
    subscriptionEndsAt: { type: Date },
    // Tracking
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Institution', institutionSchema);
