// ─────────────────────────────────────────────────────────
// redis.js — Redis Client (Gracefully disabled when no REDIS_URL)
// ─────────────────────────────────────────────────────────

let redisClient = null;

const connectRedis = async () => {
    if (!process.env.REDIS_URL) {
        console.log('⚠️  Redis caching is DISABLED (no REDIS_URL found).');
        return;
    }

    try {
        const { createClient } = require('redis');
        redisClient = createClient({
            url: process.env.REDIS_URL,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 3) {
                        console.warn('⚠️  Redis: Max reconnect attempts reached. Running without cache.');
                        return false; // Stop retrying
                    }
                    return Math.min(retries * 500, 3000);
                }
            }
        });

        redisClient.on('error', (err) => {
            console.warn('⚠️  Redis client error (non-fatal):', err.message);
        });

        await redisClient.connect();
        console.log('✅ Redis connected successfully.');
    } catch (err) {
        console.warn('⚠️  Redis connection failed (non-fatal):', err.message);
        redisClient = null; // Ensure null so app runs without cache
    }
};

const getRedisClient = () => redisClient;

module.exports = { connectRedis, getRedisClient };
