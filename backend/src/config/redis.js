const IORedis = require('ioredis');
const dotenv = require('dotenv');

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6373';

let redisInstance = null;

/**
 * 🚀 Centralized Redis connection singleton
 * Reused across API, Queues, and Workers to prevent connection leakage.
 */
const getRedisConnection = () => {
    if (!redisInstance) {
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
