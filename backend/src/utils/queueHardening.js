const { Queue } = require('bullmq');
const { getRedisConnection } = require('../config/redis');
const logger = require('./logger');

/**
 * 🏗️ Queue Hardening Utility
 * Standardizes retry strategies, DLQ logic, and operational safety.
 */

// 1. Retry Strategies
const RETRY_STRATEGIES = {
    CONSERVATIVE: {
        attempts: 10,
        backoff: {
            type: 'exponential',
            delay: 5000, // Start with 5s
        }
    },
    AGGRESSIVE: {
        attempts: 5,
        backoff: {
            type: 'fixed',
            delay: 2000, // Fixed 2s delay
        }
    },
    LOSSY: {
        attempts: 2,
        backoff: {
            type: 'fixed',
            delay: 1000,
        }
    }
};

// 2. DLQ Initialization
const dlqName = 'DeadLetterQueue';
const dlq = new Queue(dlqName, { connection: getRedisConnection() });

/**
 * Move a failed job to the DLQ with metadata
 */
const moveToDLQ = async (job, error, originalQueue) => {
    try {
        await dlq.add(originalQueue, {
            originalJobId: job.id,
            originalData: job.data,
            error: error.message,
            stack: error.stack,
            attempts: job.attemptsMade,
            queueName: originalQueue,
            failedAt: new Date().toISOString()
        }, {
            removeOnComplete: true,
            removeOnFail: false
        });
        
        logger.warn({ 
            jobId: job.id, 
            queue: originalQueue, 
            error: error.message 
        }, `📥 Job moved to Dead Letter Queue (DLQ) after ${job.attemptsMade} attempts`);
    } catch (dlqErr) {
        logger.error({ 
            err: dlqErr.message, 
            originalJobId: job.id 
        }, '❌ Failed to move job to DLQ!');
    }
};

/**
 * Helper to replay jobs from DLQ
 */
const replayDLQJob = async (jobData) => {
    const { queueName, originalData } = jobData;
    const targetQueue = new Queue(queueName, { connection: getRedisConnection() });
    await targetQueue.add('replayed_job', originalData);
    logger.info({ queueName }, '🔄 Job successfully replayed from DLQ');
};

module.exports = {
    RETRY_STRATEGIES,
    moveToDLQ,
    replayDLQJob,
    DLQ_NAME: dlqName
};
