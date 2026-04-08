const { createClient } = require('redis');

let redisClient = null;

const connectRedis = async () => {
    // Redis is currently disabled for deployment stability.
    console.log('⚠️  Redis caching is explicitly DISABLED for this environment.');
    return;
};

const getRedisClient = () => redisClient;

module.exports = { connectRedis, getRedisClient };
