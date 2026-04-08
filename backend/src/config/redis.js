const { createClient } = require('redis');

let redisClient;

const connectRedis = async () => {
    const url = process.env.REDIS_URL;

    // Skip Redis if URL is not provided in production to avoid log spam on Render
    if (!url && process.env.NODE_ENV === 'production') {
        console.log('⚠️  Redis URL missing in production. Skipping Redis initialization.');
        return;
    }

    try {
        const redisUrl = url || 'redis://localhost:6379';
        
        redisClient = createClient({
            url: redisUrl,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 3) {
                        console.error('❌ Redis: Reconnection failed after 3 attempts. Disabling Redis.');
                        return new Error('Max retries reached');
                    }
                    return 1000;
                }
            }
        });

        redisClient.on('error', (err) => {
            // Avoid log spam for connection refused on production unless it's a persistent issue
            if (process.env.NODE_ENV !== 'production' || !err.message.includes('ECONNREFUSED')) {
                console.error('❌ Redis Client Error:', err.message);
            }
        });

        redisClient.on('connect', () => {
            console.log('✅ Synchronized with Redis Engine.');
        });

        await redisClient.connect();
    } catch (error) {
        console.error('❌ Failed to connect to Redis. Caching disabled.', error.message);
        redisClient = null;
    }
};

const getRedisClient = () => redisClient;

module.exports = { connectRedis, getRedisClient };
