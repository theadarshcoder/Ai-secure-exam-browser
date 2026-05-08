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
        security: { criticalAlerts: 0, warnings: 0, status: 'safe' },
        ai: { gemini: 'down', groq: 'down' },
        connections: { active: 0 },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date()
    };

    // 0. Socket.IO Connections Check
    try {
        const io = req.app.get('socketio');
        if (io) {
            const count = io.engine.clientsCount;
            health.connections.active = count;
        }
    } catch (e) {
        console.error('Failed to fetch socket connections');
    }

    // 0. AI Status Check (Simple Config Check)
    health.ai.gemini = process.env.GEMINI_API_KEY ? 'up' : 'down';
    health.ai.groq = (process.env.GROQ_API_KEY_1 || process.env.GROQ_API_KEY_2) ? 'up' : 'down';

    // 0. Security Telemetry Check (Audit Logs - Last 24h)
    const AuditLog = require('../models/AuditLog');
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const [criticalCount, warningCount] = await Promise.all([
        AuditLog.countDocuments({ severity: 'critical', createdAt: { $gte: twentyFourHoursAgo } }),
        AuditLog.countDocuments({ severity: 'warning', createdAt: { $gte: twentyFourHoursAgo } })
    ]);

    health.security.criticalAlerts = criticalCount;
    health.security.warnings = warningCount;
    health.security.status = criticalCount > 0 ? 'breach_attempt' : (warningCount > 5 ? 'elevated_risk' : 'safe');

    // 1. MongoDB Check (Real Ping)
    const dbStart = Date.now();
    try {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.db.admin().ping();
            health.database.status = 'up';
            health.database.latency = Date.now() - dbStart;
        }
    } catch (e) {
        health.database.status = 'down';
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
    const judgeUrl = process.env.JUDGE0_API_URL;
    if (!judgeUrl) {
        health.judge0.status = 'down';
    } else {
        try {
            await axios.get(`${judgeUrl}/health`, { timeout: 2000 });
            health.judge0.status = 'up';
            health.judge0.latency = Date.now() - judgeStart;
        } catch (e) {
            try {
                await axios.get(`${judgeUrl}/languages`, { timeout: 2000 });
                health.judge0.status = 'up';
                health.judge0.latency = Date.now() - judgeStart;
            } catch (e2) {
                health.judge0.status = 'down';
            }
        }
    }

    res.json(health);
});

/**
 * ⚙️ Get Queue Statistics from BullMQ (Live Data)
 */
exports.getQueueStats = asyncHandler(async (req, res) => {
    const { codeEvaluationQueue } = require('../queues/codeGradingQueue');
    const { frontendEvaluationQueue } = require('../queues/frontendGradingQueue');
    const { notificationQueue } = require('../queues/notificationQueue');
    const { intelligenceQueue } = require('../queues/intelligenceQueue');
    const { autoSubmitQueue } = require('../queues/autoSubmitWorker');

    const queues = [
        { name: 'Code Evaluation', queue: codeEvaluationQueue },
        { name: 'Frontend Evaluation', queue: frontendEvaluationQueue },
        { name: 'Invite Email', queue: notificationQueue },
        { name: 'Intelligence', queue: intelligenceQueue },
        { name: 'Auto Submit', queue: autoSubmitQueue }
    ];

    const stats = await Promise.all(queues.map(async (q) => {
        if (!q.queue) return { name: q.name, active: 0, waiting: 0, failed: 0, completed: 0 };
        
        const [active, waiting, failed, completed] = await Promise.all([
            q.queue.getActiveCount(),
            q.queue.getWaitingCount(),
            q.queue.getFailedCount(),
            q.queue.getCompletedCount()
        ]);

        return {
            name: q.name,
            active,
            waiting,
            failed,
            completed
        };
    }));

    res.json(stats);
});
