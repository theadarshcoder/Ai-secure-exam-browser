const { Queue } = require('bullmq');
const { redisUrl } = require('../config/redis');

/**
 * 💳 Billing Queue
 * Processes payment webhooks and subscription lifecycle events asynchronously.
 */

const { RETRY_STRATEGIES } = require('../utils/queueHardening');

const billingQueue = new Queue('billing-queue', {
    connection: { url: redisUrl },
    defaultJobOptions: {
        ...RETRY_STRATEGIES.CONSERVATIVE,
        removeOnComplete: true,
        removeOnFail: false
    }
});

module.exports = { billingQueue };
