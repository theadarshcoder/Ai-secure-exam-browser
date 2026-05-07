const mongoose = require('mongoose');

const pendingVerificationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true, // 🛡️ Prevent race conditions at DB level
        index: true
    },
    tokenHash: {
        type: String,
        required: true,
        index: true
    },
    formData: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    attempts: {
        type: Number,
        default: 0
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL Index
    }
}, { timestamps: true });

module.exports = mongoose.model('PendingVerification', pendingVerificationSchema);
