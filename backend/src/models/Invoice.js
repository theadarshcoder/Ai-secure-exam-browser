const mongoose = require('mongoose');
const { INVOICE_STATUS } = require('../utils/billingConstants');

const invoiceSchema = new mongoose.Schema({
    institutionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution',
        required: true,
        index: true
    },
    subscriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription',
        required: true
    },
    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    }, // e.g. INV-2026-000123
    
    // Financial Details
    subtotal: { type: Number, required: true }, // Amount in smallest unit (e.g. cents/paise)
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    
    status: {
        type: String,
        enum: Object.values(INVOICE_STATUS),
        default: INVOICE_STATUS.OPEN
    },
    
    // Payment Metadata
    paymentProvider: { type: String, enum: ['razorpay', 'stripe', 'manual'] },
    paymentProviderId: String, // Payment ID or Invoice ID from provider
    paymentMethod: String, // card, upi, etc.
    paidAt: Date,
    dueDate: Date,
    
    // Assets
    receiptUrl: String,
    
    // Usage Snapshot (Enterprise Requirement)
    usageSnapshot: {
        studentsUsed: Number,
        examsUsed: Number,
        aiMinutesUsed: Number
    },
    
    metadata: { type: Map, of: String }
}, { timestamps: true });

// Index for status filtering (e.g. unpaid invoices)
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
