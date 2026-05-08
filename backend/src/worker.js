// ═══════════════════════════════════════════════════════════
//  worker.js — Distributed Background Worker Node
// ═══════════════════════════════════════════════════════════
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const logger = require('./utils/logger');
require('dotenv').config();

// Worker Imports
const { setupCodeEvaluationWorker } = require('./queues/codeGradingQueue');
const { setupFrontendEvaluationWorker } = require('./queues/frontendGradingQueue');
const { setupNotificationWorker } = require('./queues/notificationQueue');
const { setupBillingWorker } = require('./queues/billingWorker');
const { startIntelligenceWorker } = require('./queues/intelligenceWorker');
const { startAutoSubmitWorker } = require('./queues/autoSubmitWorker');

const startWorkers = async () => {
    try {
        logger.info('🚀 Starting Distributed Worker Node...');

        // 1. Initialize Connections
        await connectDB();
        await connectRedis();

        const { Emitter } = require('@socket.io/redis-emitter');
        const redisClient = getRedisClient();
        const emitter = new Emitter(redisClient);

        // 2. Initialize Workers with Concurrency from ENV
        // Default concurrency values if not provided
        const concurrency = {
            GRADING: parseInt(process.env.GRADING_CONCURRENCY) || 5,
            NOTIFICATION: parseInt(process.env.NOTIFICATION_CONCURRENCY) || 10,
            INTELLIGENCE: parseInt(process.env.INTELLIGENCE_CONCURRENCY) || 3,
            AUTO_SUBMIT: 1 // Cron-like, keep at 1
        };

        // Note: We are passing 'null' for IO for now. 
        // Real-time notifications from workers should eventually move to a dedicated Notification Queue 
        // that Web Nodes listen to, or use a Redis-based Socket.IO Emitter.
        const workers = [
            setupCodeEvaluationWorker(emitter, concurrency.GRADING),
            setupFrontendEvaluationWorker(emitter, concurrency.GRADING),
            setupNotificationWorker(concurrency.NOTIFICATION),
            setupBillingWorker(2), // Billing is sensitive, low concurrency
            startIntelligenceWorker(concurrency.INTELLIGENCE),
            await startAutoSubmitWorker(emitter) // io = null
        ];

        logger.info({ concurrency }, '✅ All background workers initialized.');

        // 3. Graceful Shutdown Handler
        const shutdown = async (signal) => {
            logger.info(`🛑 Received ${signal}. Shutting down workers gracefully...`);
            
            // Give workers 10 seconds to finish active jobs
            const shutdownPromises = workers.map(w => w?.close());
            
            try {
                await Promise.all(shutdownPromises);
                logger.info('👋 Workers closed. Exiting process.');
                process.exit(0);
            } catch (err) {
                logger.error({ err: err.message }, '❌ Error during worker shutdown');
                process.exit(1);
            }
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (error) {
        logger.error({ err: error.message }, '💥 Worker Node failed to start');
        process.exit(1);
    }
};

startWorkers();
