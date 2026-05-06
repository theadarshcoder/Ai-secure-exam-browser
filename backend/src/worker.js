const { connectRedis } = require('./config/redis');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

// Import worker setups
const { setupCodeEvaluationWorker } = require('./queues/codeGradingQueue');
const { setupFrontendEvaluationWorker } = require('./queues/frontendGradingQueue');
const { setupInviteEmailWorker } = require('./queues/inviteEmailQueue');
const { startIntelligenceWorker } = require('./queues/intelligenceWorker');
const { startAutoSubmitWorker } = require('./queues/autoSubmitWorker');

const workers = [];

process.on('uncaughtException', (err) => {
    logger.fatal({ err: err.message, stack: err.stack }, '💥 [Worker] Uncaught Exception');
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, '💥 [Worker] Unhandled Rejection');
    process.exit(1);
});

async function bootstrapWorker() {
    try {
        logger.info('🚀 [Worker] Bootstrapping background process...');

        await connectDB();
        logger.info('✅ [Worker] MongoDB Connected');

        await connectRedis();
        logger.info('✅ [Worker] Redis Connected');

        // We pass null for Socket.io because this is a dedicated worker process.
        // If sockets are needed to emit results, we might need a separate pub/sub mechanism
        // but for now, the workers use their connection to emit events via a shared Redis adapter 
        // if we pass an io instance. Wait, `setupCodeEvaluationWorker(io)` uses `io.to(...).emit(...)`.
        // How will a standalone worker emit to Socket.io clients connected to the API?
        // Let's create an IO emitter!
        
        const { Emitter } = require('@socket.io/redis-emitter');
        const { getRedisClient } = require('./config/redis');
        const redisClient = getRedisClient();
        const io = new Emitter(redisClient);

        workers.push(setupCodeEvaluationWorker(io));
        workers.push(setupFrontendEvaluationWorker(io));
        workers.push(setupInviteEmailWorker());
        workers.push(startIntelligenceWorker());
        workers.push(await startAutoSubmitWorker(io));

        logger.info('✅ [Worker] All background workers initialized.');

    } catch (err) {
        console.error('❌ [Worker] Fatal Bootstrap Failure:', err.message);
        process.exit(1);
    }
}

bootstrapWorker();

// Graceful shutdown
async function gracefulShutdown(signal) {
    console.log(`\n🛑 [Worker SHUTDOWN] Received ${signal}. Closing active workers...`);
    
    const shutdownWithTimeout = (promise, timeout = 10000, name) =>
        Promise.race([
            promise,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Shutdown timeout for ${name}`)), timeout)
            )
        ]);

    try {
        await Promise.all(workers.map((w, i) => 
            shutdownWithTimeout(w.close(), 15000, `Worker-${i}`).catch(e => logger.warn(`⚠️  ${e.message}`))
        ));
        logger.info('✅ [Worker SHUTDOWN] All workers closed safely');
        process.exit(0);
    } catch (err) {
        logger.error({ err: err.message }, '❌ [Worker SHUTDOWN] Error during cleanup');
        process.exit(1);
    }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
