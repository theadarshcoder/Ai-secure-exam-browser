const logger = require('./logger');
const { getRedisClient } = require('../config/redis');

const { updateEventLoopLag } = require('./metrics');

let localEventLoopLag = 0;

const startLagMonitor = () => {
    let start = Date.now();
    setInterval(() => {
        const now = Date.now();
        localEventLoopLag = Math.max(0, now - start - 1000);
        
        // Report to Prometheus
        updateEventLoopLag(localEventLoopLag);

        if (localEventLoopLag > 100) {
            logger.warn({ lag: localEventLoopLag }, '🚨 EVENT LOOP LAG DETECTED');
        }
        start = now;
    }, 1000).unref();
};

const trackQueueMetric = async (queueName, waitTime, processTime) => {
    const redis = getRedisClient();
    if (!redis) return;

    try {
        const key = `metrics:queue:${queueName}`;
        await redis.hset(key, {
            lastWaitTime: waitTime.toString(),
            lastProcessTime: processTime.toString()
        });
        await redis.hincrby(key, 'count', 1);
        await redis.hincrby(key, 'totalWaitTime', Math.round(waitTime));
        await redis.hincrby(key, 'totalProcessTime', Math.round(processTime));
    } catch (err) {
        logger.error({ err: err.message }, 'Failed to track queue metric in Redis');
    }
};

const getMetrics = async () => {
    const redis = getRedisClient();
    const metrics = {
        eventLoopLag: localEventLoopLag,
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        timestamp: new Date(),
        queueMetrics: {},
        status: 'HEALTHY'
    };

    if (localEventLoopLag > 150) metrics.status = 'STRESSED';

    if (redis) {
        const queues = ['CodeEvaluation', 'AutoSubmit', 'Intelligence'];
        for (const q of queues) {
            const data = await redis.hgetall(`metrics:queue:${q}`);
            if (data && data.count) {
                const count = parseInt(data.count);
                const avgWaitTime = parseInt(data.totalWaitTime) / count;
                metrics.queueMetrics[q] = {
                    avgWaitTime,
                    avgProcessTime: parseInt(data.totalProcessTime) / count,
                    count
                };
                if (avgWaitTime > 30000) metrics.status = 'STRESSED'; // Wait > 30s
            }
        }
    }

    return metrics;
};

const getSystemStatus = () => {
    return localEventLoopLag > 150 ? 'STRESSED' : 'HEALTHY';
};

module.exports = { startLagMonitor, getMetrics, trackQueueMetric, getSystemStatus };
