const { Worker } = require('bullmq');
const billingService = require('../services/billingService');
const reconciliationService = require('../services/reconciliationService');
const ProcessedWebhook = require('../models/ProcessedWebhook');
const logger = require('../utils/logger');
const { RETRY_STRATEGIES, moveToDLQ } = require('../utils/queueHardening');
const { getRedisConnection } = require('../config/redis');

/**
 * 🛠️ Billing Worker
 * Consumes jobs from billing-queue. 
 * This is where the actual state changes happen after a verified webhook or timer.
 */

const setupBillingWorker = (concurrency = 2) => {
    const worker = new Worker('billing-queue', async (job) => {
        const { type, eventId, eventType, provider, payload, institutionId } = job.data;
        
        logger.info({ 
            jobId: job.id, 
            type: type || eventType, 
            institutionId: institutionId || 'system',
            attempt: job.attemptsMade + 1
        }, `[Billing Worker] Processing Job`);

        // 🛡️ [STEP 4] Idempotency Check for Webhooks
        if (eventId) {
            const alreadyProcessed = await ProcessedWebhook.findOne({ eventId, status: 'processed' });
            if (alreadyProcessed) {
                logger.info({ eventId, jobId: job.id }, `♻️ [Billing Worker] Event already processed. Skipping.`);
                return { skipped: true, reason: 'ALREADY_PROCESSED' };
            }
        }

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
            logger.error({ 
                jobId: job.id, 
                err: error.message, 
                stack: error.stack 
            }, `[Billing Worker] Job failed`);

            if (eventId) {
                await ProcessedWebhook.findOneAndUpdate(
                    { eventId }, 
                    { status: 'failed', errorDetails: error.message },
                    { upsert: true }
                );
            }
            throw error;
        }
    }, {
        connection: getRedisConnection(),
        concurrency: parseInt(concurrency),
        settings: {
            backoffStrategies: {
                ...RETRY_STRATEGIES.CONSERVATIVE.backoff
            }
        }
    });

    worker.on('failed', async (job, err) => {
        const attempt = job.attemptsMade;
        const maxAttempts = RETRY_STRATEGIES.CONSERVATIVE.attempts;

        if (attempt >= maxAttempts) {
            logger.error({ jobId: job.id, err: err.message }, `[Billing Worker] CRITICAL: Job definitively failed. Moving to DLQ.`);
            await moveToDLQ(job, err, 'billing-queue');
        } else {
            logger.warn({ jobId: job.id, attempt, err: err.message }, `[Billing Worker] Job failed. Retrying...`);
        }
    });

    return worker;
};

module.exports = { setupBillingWorker };
