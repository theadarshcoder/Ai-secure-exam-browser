const Subscription = require('../models/Subscription');
const Institution = require('../models/Institution');
const InstitutionUsage = require('../models/InstitutionUsage');
const billingService = require('./billingService');
const logger = require('../utils/logger');
const { SUBSCRIPTION_STATUS } = require('../utils/billingConstants');

/**
 * 🔄 BILLING RECONCILIATION ENGINE
 * Daily fail-safe for ensuring local state matches financial reality.
 */

/**
 * Daily Reconciliation Sync
 * Scans for expired subscriptions and resets quotas for renewed cycles.
 */
const dailyReconciliation = async () => {
    logger.info('🚀 [Reconciliation] Starting Daily Billing Sync...');
    const now = new Date();

    try {
        // 1. Find all Active/Trialing subscriptions that have exceeded their period
        const expiredSubs = await Subscription.find({
            status: { $in: [SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.TRIALING, SUBSCRIPTION_STATUS.GRACE_PERIOD] },
            currentPeriodEnd: { $lt: now }
        });

        logger.info(`[Reconciliation] Found ${expiredSubs.length} subscriptions requiring status check.`);

        for (const sub of expiredSubs) {
            // Logic: In a real system, you'd fetch the status from Razorpay API here.
            // For now, we perform automated lifecycle transitions.
            
            if (sub.status === SUBSCRIPTION_STATUS.TRIALING) {
                // Trial expired -> Hard Block
                await billingService.expireSubscription(sub.institutionId);
                logger.info(`[Reconciliation] Expired trial for ${sub.institutionId}`);
            } else {
                // Paid plan expired -> Enter Past Due / Grace Period
                await billingService.handlePaymentFailure(sub.institutionId, { 
                    reason: 'Automated period end check - No renewal detected' 
                });
                logger.info(`[Reconciliation] Moved ${sub.institutionId} to lifecycle transition.`);
            }
        }

        // 2. Quota Reset for Renewed Cycles
        // Find subscriptions that started a new period in the last 24 hours
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const renewedSubs = await Subscription.find({
            status: SUBSCRIPTION_STATUS.ACTIVE,
            currentPeriodStart: { $gte: yesterday }
        });

        for (const sub of renewedSubs) {
            // Reset Monthly Quotas (examsCreated, studentsUsed reset if applicable)
            // Note: Enterprise might have custom carry-over logic.
            await InstitutionUsage.findOneAndUpdate(
                { institutionId: sub.institutionId },
                { 
                    $set: { examsCreated: 0, aiMinutesUsed: 0 }, // Students usually don't reset unless it's per-cycle
                    $push: { history: { date: now, usageSnapshot: sub.limitsSnapshot } }
                }
            );
            logger.info(`[Reconciliation] Quotas reset for ${sub.institutionId}`);
        }

        logger.info('[Reconciliation] Daily Billing Sync Completed Successfully.');
    } catch (err) {
        logger.error(`🔥 [Reconciliation] Sync Failed: ${err.message}`);
    }
};

module.exports = {
    dailyReconciliation
};
