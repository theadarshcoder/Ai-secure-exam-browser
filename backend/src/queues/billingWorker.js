const { Worker } = require('bullmq');
const { redisUrl } = require('../config/redis');
const billingService = require('../services/billingService');
const reconciliationService = require('../services/reconciliationService');
const ProcessedWebhook = require('../models/ProcessedWebhook');
const logger = require('../utils/logger');

/**
 * 🛠️ Billing Worker
 * Consumes jobs from billing-queue. 
 * This is where the actual state changes happen after a verified webhook or timer.
 */

const setupBillingWorker = () => {
    const worker = new Worker('billing-queue', async (job) => {
        const { type, eventId, eventType, provider, payload, institutionId } = job.data;
        
        logger.info(`[Billing Worker] Processing ${type || eventType} for inst: ${institutionId || 'system'}`);

        try {
            // A. Webhook Processing
            if (type === 'webhook' || eventType) {
                switch (eventType) {
                    case 'order.paid':
                    case 'payment.captured':
                        await billingService.activateSubscription(institutionId, payload.planId, payload);
                        break;
                    case 'subscription.cancelled':
                    case 'subscription.expired':
                        await billingService.expireSubscription(institutionId);
                        break;
                    case 'payment.failed':
                        await billingService.handlePaymentFailure(institutionId, payload.error);
                        break;
                }
                
                if (eventId) {
                    await ProcessedWebhook.findOneAndUpdate({ eventId }, { status: 'processed', processedAt: new Date() });
                }
            }

            // B. Lifecycle Automation (Delayed Jobs)
            if (type === 'LIFECYCLE_EXPIRY') {
                await billingService.expireSubscription(institutionId);
            }

            // C. Periodic Reconciliation (Cron-like)
            if (type === 'DAILY_RECONCILIATION') {
                await reconciliationService.dailyReconciliation();
            }

        } catch (error) {
            logger.error(`[Billing Worker] Job ${job.id} failed: ${error.message}`);
            if (eventId) {
                await ProcessedWebhook.findOneAndUpdate({ eventId }, { status: 'failed', errorDetails: error.message });
            }
            throw error;
        }
    }, {
        connection: { url: redisUrl },
        concurrency: 5
    });

    worker.on('failed', (job, err) => {
        logger.error(`[Billing Worker] CRITICAL: Job ${job.id} definitively failed after all retries. Manual intervention required.`);
    });

    return worker;
};

module.exports = { setupBillingWorker };
