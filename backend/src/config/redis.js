const { createClient } = require('redis');

let redisClient;

const connectRedis = async () => {
    try {
        const url = process.env.REDIS_URL || 'redis://localhost:6379';
        
        redisClient = createClient({
            url: url
        });

        redisClient.on('error', (err) => {
            console.error('❌ Redis Client Error:', err.message);
        });

        redisClient.on('connect', () => {
            console.log('✅ Synchronized with Redis Engine.');
        });

        await redisClient.connect();
    } catch (error) {
        console.error('❌ Failed to connect to Redis. Caching disabled.', error.message);
        // We will default back to MongoDB if redisClient is not connected.
        redisClient = null;
    }
};

const getRedisClient = () => redisClient;

module.exports = { connectRedis, getRedisClient };
