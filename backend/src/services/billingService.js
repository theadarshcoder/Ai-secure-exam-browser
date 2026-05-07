const mongoose = require('mongoose');
const EventEmitter = require('events');
const Subscription = require('../models/Subscription');
const Institution = require('../models/Institution');
const InstitutionUsage = require('../models/InstitutionUsage');
const Invoice = require('../models/Invoice');
const AuditLog = require('../models/AuditLog');
const PLANS = require('../config/plans');
const { SUBSCRIPTION_STATUS, PLAN_TYPES, INVOICE_STATUS } = require('../utils/billingConstants');
const { billingQueue } = require('../queues/billingQueue');
const cacheService = require('./cacheService');

class BillingEmitter extends EventEmitter {}
const billingEvents = new BillingEmitter();

/**
 * 🏢 BILLING DOMAIN ENGINE
 * The single source of truth for all subscription and billing state changes.
 * Emits events for emails, analytics, and socket notifications.
 */

/**
 * Activate or Upgrade a Subscription
 */
const activateSubscription = async (institutionId, planId, paymentData = {}, actorId = null) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const plan = PLANS[planId.toUpperCase()];
        if (!plan) throw new Error(`Invalid plan ID: ${planId}`);

        const now = new Date();
        const durationMonths = paymentData.billingCycle === 'yearly' ? 12 : 1;
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + durationMonths);

        // 1. Update/Create Subscription
        const sub = await Subscription.findOneAndUpdate(
            { institutionId },
            {
                planId,
                status: SUBSCRIPTION_STATUS.ACTIVE,
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
                autoRenew: true,
                paymentProvider: paymentData.provider || 'manual',
                paymentCustomerId: paymentData.customerId,
                paymentSubscriptionId: paymentData.subscriptionId,
                featuresSnapshot: plan.features,
                limitsSnapshot: plan.limits,
                $set: { convertedFromTrial: true }
            },
            { upsert: true, new: true, session }
        );

        // 2. Sync Institution Status
        const institution = await Institution.findByIdAndUpdate(
            institutionId,
            { 
                status: 'active',
                statusUpdatedAt: now,
                subscriptionId: sub._id 
            },
            { session, new: true }
        );

        // 3. Generate Human-Readable Invoice Number
        const year = now.getFullYear();
        const count = await Invoice.countDocuments({ createdAt: { $gte: new Date(year, 0, 1) } }).session(session);
        const invoiceNumber = `INV-${year}-${(count + 1).toString().padStart(6, '0')}`;

        // 4. Create Invoice Record
        const usage = await InstitutionUsage.findOne({ institutionId }).session(session);
        const invoice = new Invoice({
            institutionId,
            subscriptionId: sub._id,
            invoiceNumber,
            subtotal: paymentData.amount || 0,
            total: paymentData.amount || 0,
            status: INVOICE_STATUS.PAID,
            paymentProvider: paymentData.provider,
            paymentProviderId: paymentData.paymentId,
            paidAt: now,
            usageSnapshot: {
                studentsUsed: usage?.studentsUsed || 0,
                examsUsed: usage?.examsUsed || 0
            }
        });
        await invoice.save({ session });

        // 5. Audit Log
        await AuditLog.create([{
            performedBy: actorId || institutionId,
            action: 'SUBSCRIPTION_ACTIVATED',
            severity: 'info',
            institutionId,
            actorRole: actorId ? 'super_admin' : 'system',
            details: { planId, invoiceNumber, amount: paymentData.amount }
        }], { session });

        await session.commitTransaction();
        
        // ⚡ Clear Access Cache
        await cacheService.clearCache(`inst_access:${institutionId}`);

        // ⏰ Schedule Automated Expiry Job
        const delay = Math.max(0, periodEnd.getTime() - Date.now());
        await billingQueue.add('lifecycle-expiry', 
            { type: 'LIFECYCLE_EXPIRY', institutionId }, 
            { delay, jobId: `expiry_${institutionId}_${periodEnd.getTime()}` }
        );

        // 📡 Emit Event
        billingEvents.emit('subscription.activated', { institution, sub, invoice });

        return { sub, invoice };
    } catch (error) {
        if (session.inTransaction()) await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Handle Subscription Expiry
 */
const expireSubscription = async (institutionId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const sub = await Subscription.findOne({ institutionId }).session(session);
        if (!sub) return;

        sub.status = SUBSCRIPTION_STATUS.EXPIRED;
        await sub.save({ session });

        await Institution.findByIdAndUpdate(
            institutionId,
            { status: 'trial_expired', statusUpdatedAt: new Date() },
            { session }
        );

        await AuditLog.create([{
            performedBy: institutionId, // Track against the tenant for system events
            action: 'SUBSCRIPTION_EXPIRED',
            severity: 'warning',
            institutionId,
            actorRole: 'system'
        }], { session });

        await session.commitTransaction();
        await cacheService.clearCache(`inst_access:${institutionId}`);
        
        billingEvents.emit('subscription.expired', { institutionId });
    } catch (error) {
        if (session.inTransaction()) await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Handle Payment Failure & Grace Period
 */
const handlePaymentFailure = async (institutionId, errorDetails = {}) => {
    const sub = await Subscription.findOne({ institutionId });
    if (!sub) return;

    // Transition: active -> past_due -> grace_period -> expired
    let newStatus = SUBSCRIPTION_STATUS.PAST_DUE;
    let instStatus = 'active'; // Stay active during past_due

    if (sub.status === SUBSCRIPTION_STATUS.PAST_DUE) {
        newStatus = SUBSCRIPTION_STATUS.GRACE_PERIOD;
        instStatus = 'grace_period';
    } else if (sub.status === SUBSCRIPTION_STATUS.GRACE_PERIOD) {
        newStatus = SUBSCRIPTION_STATUS.EXPIRED;
        instStatus = 'payment_failed';
    }

    sub.status = newStatus;
    await sub.save();

    await Institution.findByIdAndUpdate(institutionId, { 
        status: instStatus, 
        statusUpdatedAt: new Date() 
    });
    
    await cacheService.clearCache(`inst_access:${institutionId}`);
    
    billingEvents.emit('payment.failed', { institutionId, status: newStatus, errorDetails });
};

module.exports = {
    activateSubscription,
    expireSubscription,
    handlePaymentFailure,
    billingEvents
};
