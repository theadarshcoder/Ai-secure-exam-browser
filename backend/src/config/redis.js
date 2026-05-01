const IORedis = require('ioredis');
const dotenv = require('dotenv');

dotenv.config();

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
    throw new Error("❌ REDIS_URL is required for this system (Core Dependency for Sessions, Queues, and State)");
}

let redisInstance = null;

/**
 * 🚀 Centralized Redis connection singleton
 * Reused across API, Queues, and Workers to prevent connection leakage.
 */
const getRedisConnection = () => {
    if (!redisInstance) {
        console.log(`📡 [Redis] Connecting to: ${redisUrl}`);
        console.log('🔄 Initializing singleton Redis connection...');
        redisInstance = new IORedis(redisUrl, {
            maxRetriesPerRequest: null, // Required for BullMQ
            enableReadyCheck: false,
            reconnectOnError: (err) => {
                const targetError = 'READONLY';
                if (err.message.includes(targetError)) {
                    return true;
                }
            },
        });

        redisInstance.on('connect', () => {
            console.log('✅ Redis connected successfully (Singleton)');
        });

        redisInstance.on('error', (err) => {
            console.error('❌ Redis connection error:', err.message);
            process.exit(1); // 🔴 CRASH ON FAILURE (Hard Dependency)
        });
    }
    return redisInstance;
};

/**
 * Legacy support for the existing API
 */
const connectRedis = async () => {
    return getRedisConnection();
};

const getRedisClient = () => {
    return getRedisConnection();
};

module.exports = {
    connectRedis,
    getRedisClient,
    getRedisConnection,
    redisUrl
};
