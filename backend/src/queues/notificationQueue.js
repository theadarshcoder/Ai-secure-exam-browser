const { Queue, Worker } = require('bullmq');
const emailService = require('../services/emailService');
const { getRedisConnection } = require('../config/redis');
const logger = require('../utils/logger');
const { RETRY_STRATEGIES, moveToDLQ } = require('../utils/queueHardening');

const connection = getRedisConnection();

/**
 * 📨 Notification Queue
 * Handles all background communications (Emails, Webhooks, In-app alerts).
 * Consolidates multiple legacy queues for operational simplicity.
 */
const notificationQueue = new Queue('Notifications', { connection });

const NOTIFICATION_TYPES = {
    INVITE: 'sendInviteEmail',
    TRIAL_EXPIRY: 'sendTrialEndingEmail',
    PAYMENT_FAILED: 'sendPaymentFailedEmail',
    UPGRADE_SUCCESS: 'sendUpgradeSuccessEmail',
    SECURITY_ALERT: 'sendPasswordResetEmail',
    ACCESS_APPROVED: 'sendAccessApprovedEmail'
};

/**
 * Dispatch a notification job to the background worker.
 */
const dispatchNotification = async (type, data, options = {}) => {
    const jobName = type;
    
    // Choose retry strategy based on type
    const strategy = (type === NOTIFICATION_TYPES.PAYMENT_FAILED || type === NOTIFICATION_TYPES.UPGRADE_SUCCESS)
        ? RETRY_STRATEGIES.CONSERVATIVE
        : RETRY_STRATEGIES.AGGRESSIVE;

    await notificationQueue.add(jobName, data, {
        ...strategy,
        removeOnComplete: true,
        ...options
    });

    logger.info({ type, to: data.to }, `📨 [Notification Queue] Job dispatched: ${type}`);
};

/**
 * Add multiple notification jobs in a single Redis transaction.
 */
const dispatchBulkNotifications = async (jobs) => {
    const bulkJobs = jobs.map(job => ({
        name: NOTIFICATION_TYPES.INVITE,
        data: job,
        opts: {
            ...RETRY_STRATEGIES.AGGRESSIVE,
            timeout: 10000,
            removeOnComplete: true
        }
    }));

    await notificationQueue.addBulk(bulkJobs);
    logger.info({ count: bulkJobs.length }, `📨 [Notification Queue] ${bulkJobs.length} bulk notifications added`);
};

const setupNotificationWorker = () => {
    const worker = new Worker('Notifications', async (job) => {
        const { name, data } = job;
        
        logger.info({ jobId: job.id, type: name, to: data.to }, `📧 [Notification Worker] Processing: ${name}`);

        // Dynamic mapper for email service functions
        const serviceMap = {
            [NOTIFICATION_TYPES.INVITE]: emailService.sendInviteEmail,
            [NOTIFICATION_TYPES.TRIAL_EXPIRY]: emailService.sendTrialEndingEmail,
            [NOTIFICATION_TYPES.PAYMENT_FAILED]: emailService.sendPaymentFailedEmail,
            [NOTIFICATION_TYPES.UPGRADE_SUCCESS]: emailService.sendUpgradeSuccessEmail,
            [NOTIFICATION_TYPES.SECURITY_ALERT]: emailService.sendPasswordResetEmail,
            [NOTIFICATION_TYPES.ACCESS_APPROVED]: emailService.sendAccessApprovedEmail
        };

        const serviceFunc = serviceMap[name];
        if (!serviceFunc) {
            throw new Error(`Unknown notification type: ${name}`);
        }

        const result = await serviceFunc(data);

        if (!result.success) {
            // Check if final attempt
            if (job.attemptsMade + 1 >= job.opts.attempts) {
                await moveToDLQ(job, new Error(result.error), 'Notifications');
            }
            throw new Error(`Notification failed: ${result.error}`);
        }

        return result;
    }, {
        connection,
        concurrency: 5 // Higher concurrency for non-billing tasks
    });

    worker.on('failed', (job, err) => {
        logger.error({ jobId: job?.id, type: job?.name, err: err.message }, `❌ [Notification Worker] Job Failed`);
    });

    return worker;
};

module.exports = {
    notificationQueue,
    dispatchNotification,
    dispatchBulkNotifications,
    setupNotificationWorker,
    NOTIFICATION_TYPES
};
