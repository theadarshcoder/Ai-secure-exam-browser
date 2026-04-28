const mongoose = require('mongoose');

const intelligenceLogSchema = new mongoose.Schema({
    type: { 
        type: String, 
        enum: ['ERROR', 'SECURITY', 'SYSTEM', 'AUTH', 'VIOLATION'],
        required: true 
    },
    severity: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low' 
    },
    message: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed }, // Stack trace, metadata, etc.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    path: { type: String },
    method: { type: String },
    statusCode: { type: Number },
    ip: { type: String },
    errorId: { type: String },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Auto-expire logs after 30 days to save space
intelligenceLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('IntelligenceLog', intelligenceLogSchema);
