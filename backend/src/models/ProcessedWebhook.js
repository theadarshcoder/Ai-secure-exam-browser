const mongoose = require('mongoose');

/**
 * 🛡️ ProcessedWebhook Model
 * Ensures idempotency and provides a secure audit trail for payment provider events.
 * Prevents double-processing and enables deep debugging of webhook tampering.
 */

const processedWebhookSchema = new mongoose.Schema({
    eventId: {
        type: String,
        required: true,
        unique: true, // ⚡ Atomic Idempotency: Duplicate inserts will fail
        index: true
    },
    provider: {
        type: String,
        required: true,
        enum: ['razorpay', 'stripe', 'manual']
    },
    eventType: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['received', 'processed', 'failed', 'ignored_duplicate', 'signature_invalid'],
        default: 'received'
    },
    institutionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution',
        index: true
    },
    
    // Security & Auditing
    payloadHash: { type: String, required: true }, // SHA256 of raw body
    rawPayload: { type: String }, // Stringified raw body
    providerApiVersion: { type: String },
    
    processedAt: { type: Date },
    errorDetails: { type: String },
    
    // Auto-cleanup after 7 days to keep DB lean
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        index: { expires: 0 }
    }
}, { timestamps: true });

module.exports = mongoose.model('ProcessedWebhook', processedWebhookSchema);
