const mongoose = require('mongoose');
const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');
const { getSystemStatus } = require('../utils/monitor');

/**
 * 🏥 Health Controller
 * - Liveness: App is running
 * - Readiness: App can serve requests (DB/Redis/Queues)
 * - Detailed: Full metadata for internal debugging
 */

/**
 * 🟢 Liveness Check (/health/live)
 * Simple check to see if the process is up.
 */
const getLiveness = (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date() });
};

/**
 * 🟡 Readiness Check (/health/ready)
 * Verifies that critical dependencies are connected.
 */
const getReadiness = async (req, res) => {
    const checks = {
        db: false,
        redis: false,
        uptime: process.uptime()
    };

    try {
        // 1. MongoDB Check (with 2s timeout)
        const dbStatus = mongoose.connection.readyState;
        checks.db = dbStatus === 1; // 1 = connected

        // 2. Redis Check (with 2s timeout)
        const redis = getRedisClient();
        if (redis) {
            const redisCheck = await Promise.race([
                redis.ping(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
            ]);
            checks.redis = redisCheck === 'PONG';
        }

        const isHealthy = checks.db && checks.redis;
        const status = isHealthy ? 'UP' : 'DEGRADED';
        const statusCode = isHealthy ? 200 : 503;

        res.status(statusCode).json({
            status,
            checks,
            timestamp: new Date()
        });
    } catch (err) {
        logger.error({ err: err.message }, 'Readiness check failed');
        res.status(503).json({
            status: 'UNHEALTHY',
            error: err.message,
            timestamp: new Date()
        });
    }
};

/**
 * 📁 Detailed Health Check (/health/detailed)
 * Full metadata for internal debugging. Protected by Admin/IP whitelist.
 */
const getDetailedHealth = async (req, res) => {
    const redis = getRedisClient();
    const systemStatus = getSystemStatus(); // Healthy / Stressed

    const detailed = {
        status: systemStatus,
        node: process.version,
        env: process.env.NODE_ENV,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        db: {
            status: mongoose.connection.readyState,
            name: mongoose.connection.name,
            host: mongoose.connection.host
        },
        redis: {
            status: redis ? 'CONNECTED' : 'DISCONNECTED'
        },
        system: {
            pid: process.pid,
            platform: process.platform
        }
    };

    res.status(200).json(detailed);
};

module.exports = {
    getLiveness,
    getReadiness,
    getDetailedHealth
};
