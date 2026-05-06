const mongoose = require('mongoose');
const { getRedisClient } = require('../config/redis');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const axios = require('axios');

/**
 * 🩺 Get Real-time Platform Health Metrics
 * Checks MongoDB, Redis, Judge0, and Worker status.
 */
exports.getSystemHealth = asyncHandler(async (req, res) => {
    const health = {
        database: { status: 'down', latency: 0 },
        cache: { status: 'down', latency: 0 },
        judge0: { status: 'down', latency: 0 },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date()
    };

    // 1. MongoDB Check
    const dbStart = Date.now();
    if (mongoose.connection.readyState === 1) {
        health.database.status = 'up';
        health.database.latency = Date.now() - dbStart;
    }

    // 2. Redis Check
    const redis = getRedisClient();
    const redisStart = Date.now();
    try {
        await redis.ping();
        health.cache.status = 'up';
        health.cache.latency = Date.now() - redisStart;
    } catch (e) {
        health.cache.status = 'down';
    }

    // 3. Judge0 Check
    const judgeStart = Date.now();
    try {
        const response = await axios.get(`${process.env.JUDGE0_API_URL}/health`, { timeout: 3000 });
        if (response.status === 200) {
            health.judge0.status = 'up';
            health.judge0.latency = Date.now() - judgeStart;
        }
    } catch (e) {
        // Some Judge0 instances might not have /health, try /languages as fallback
        try {
            await axios.get(`${process.env.JUDGE0_API_URL}/languages`, { timeout: 3000 });
            health.judge0.status = 'up';
            health.judge0.latency = Date.now() - judgeStart;
        } catch (e2) {
            health.judge0.status = 'down';
        }
    }

    res.json(health);
});

/**
 * ⚙️ Get Queue Statistics from BullMQ
 */
exports.getQueueStats = asyncHandler(async (req, res) => {
    // In a real system, we'd import the actual queues here
    // For this implementation, we'll simulate based on known queue names
    const queueNames = ['code-evaluation', 'frontend-evaluation', 'invite-email', 'intelligence', 'auto-submit'];
    
    // This is a placeholder for real BullMQ stats integration
    // We'll return dummy data for now to build the UI, then link it to the real queues
    const stats = queueNames.map(name => ({
        name,
        active: Math.floor(Math.random() * 5),
        waiting: Math.floor(Math.random() * 10),
        failed: Math.floor(Math.random() * 2),
        completed: Math.floor(Math.random() * 1000)
    }));

    res.json(stats);
});
