const IORedis = require('ioredis');
const dotenv = require('dotenv');

dotenv.config();

const redisUrl = process.env.REDIS_URL;
const redisClusterNodes = process.env.REDIS_CLUSTER_NODES; // Format: "host1:6379,host2:6379"

if (!redisUrl && !redisClusterNodes) {
    throw new Error("❌ REDIS_URL or REDIS_CLUSTER_NODES is required (Core Dependency for Sessions, Queues, and State)");
}

let redisInstance = null;

/**
 * 🚀 Centralized Redis connection singleton
 * Reused across API, Queues, and Workers to prevent connection leakage.
 */
const getRedisConnection = () => {
    if (!redisInstance) {
        if (redisClusterNodes) {
            console.log('📡 [Redis] Initializing Cluster Mode...');
            const nodes = redisClusterNodes.split(',').map(node => {
                const [host, port] = node.split(':');
                return { host, port: parseInt(port) };
            });
            redisInstance = new IORedis.Cluster(nodes, {
                redisOptions: {
                    maxRetriesPerRequest: null,
                    enableReadyCheck: false
                }
            });
        } else {
            console.log(`📡 [Redis] Connecting to Standalone: ${redisUrl}`);
            redisInstance = new IORedis(redisUrl, {
                maxRetriesPerRequest: null, // Required for BullMQ
                enableReadyCheck: false,
                lazyConnect: true, // Only connect when needed
                connectTimeout: 10000,
                reconnectOnError: (err) => {
                    const targetError = 'READONLY';
                    if (err.message.includes(targetError)) return true;
                },
                // 🛠️ Optimization for Limited Plans
                maxIdleTime: 30000, // Close idle connections after 30s
                enableKeepAlive: true,
                keepAliveDelay: 1000
            });
        }

        redisInstance.on('connect', () => {
            console.log(`✅ Redis ${redisClusterNodes ? 'Cluster' : 'Standalone'} connected successfully`);
        });

        redisInstance.on('error', (err) => {
            console.error('❌ Redis connection error:', err.message);
            // In high-scale prod, we might not want to crash immediately, 
            // but for now we follow the hard-dependency rule.
            if (process.env.NODE_ENV === 'production') {
                 // Sentry?.captureException(err);
            }
        });
    }
    return redisInstance;
};

/**
 * 🚀 Creates a fresh connection
 * Useful for Pub/Sub or duplicated connections where a singleton isn't suitable.
 */
const createNewConnection = () => {
    if (redisClusterNodes) {
        const nodes = redisClusterNodes.split(',').map(node => {
            const [host, port] = node.split(':');
            return { host, port: parseInt(port) };
        });
        return new IORedis.Cluster(nodes, {
            redisOptions: { maxRetriesPerRequest: null, enableReadyCheck: false }
        });
    } else {
        return new IORedis(redisUrl, { 
            maxRetriesPerRequest: null, 
            enableReadyCheck: false,
            lazyConnect: true,
            maxIdleTime: 30000 
        });
    }
};

/**
 * Legacy support for the existing API
 */
const connectRedis = async () => getRedisConnection();
const getRedisClient = () => getRedisConnection();

module.exports = {
    connectRedis,
    getRedisClient,
    getRedisConnection,
    createNewConnection,
    redisUrl
};
