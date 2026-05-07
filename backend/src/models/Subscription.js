const mongoose = require('mongoose');
const { SUBSCRIPTION_STATUS, PLAN_TYPES } = require('../utils/billingConstants');

const subscriptionSchema = new mongoose.Schema({
    institutionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution',
        required: true,
        unique: true
    },
    planId: {
        type: String,
        required: true,
        enum: Object.values(PLAN_TYPES),
        default: PLAN_TYPES.TRIAL
    },
    status: {
        type: String,
        required: true,
        enum: Object.values(SUBSCRIPTION_STATUS),
        default: SUBSCRIPTION_STATUS.TRIALING
    },
    
    // 📅 Period Management
    currentPeriodStart: { type: Date, default: Date.now },
    currentPeriodEnd: { type: Date, required: true },
    trialEndsAt: { type: Date },
    
    // 🔄 Auto-Renewal & Lifecycle
    autoRenew: { type: Boolean, default: true },
    convertedFromTrial: { type: Boolean, default: false },
    
    // 🛡️ Plan Snapshots (Protect legacy customers from global plan changes)
    featuresSnapshot: { type: Map, of: Boolean },
    limitsSnapshot: { type: Map, of: Number },

    // Payment Provider Metadata
    paymentProvider: {
        type: String,
        enum: ['stripe', 'razorpay', 'manual'],
        default: 'manual'
    },
    paymentCustomerId: String,
    paymentSubscriptionId: String,
    
    cancelAtPeriodEnd: { type: Boolean, default: false },
    canceledAt: Date
}, { timestamps: true });

// 🛡️ Indexes for faster lookups
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
