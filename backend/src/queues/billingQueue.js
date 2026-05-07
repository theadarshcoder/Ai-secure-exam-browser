const { Queue } = require('bullmq');
const { redisUrl } = require('../config/redis');

/**
 * 💳 Billing Queue
 * Processes payment webhooks and subscription lifecycle events asynchronously.
 */

const billingQueue = new Queue('billing-queue', {
    connection: { url: redisUrl },
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: 'exponential',
            delay: 5000, // 5 seconds initial delay
        },
        removeOnComplete: true,
        removeOnFail: false, // Keep failed jobs for manual review (Dead Letter Queue)
    }
});

module.exports = { billingQueue };
