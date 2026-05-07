const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const { replayDLQJob, DLQ_NAME } = require('../utils/queueHardening');
const { Queue } = require('bullmq');
const { getRedisConnection } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * 🛠️ Admin Operations Routes
 * - DLQ Replay
 * - Queue Pause/Resume
 */

// 🔄 Replay all jobs from DLQ
router.post('/queues/replay-dlq', verifyToken, checkRole(['super_admin']), async (req, res) => {
    try {
        const dlq = new Queue(DLQ_NAME, { connection: getRedisConnection() });
        const jobs = await dlq.getJobs(['failed', 'completed', 'waiting']);
        
        logger.info({ count: jobs.length }, `🔄 Replaying ${jobs.length} jobs from DLQ`);

        for (const job of jobs) {
            await replayDLQJob(job.data);
            await job.remove();
        }

        res.json({ success: true, replayed: jobs.length });
    } catch (err) {
        logger.error({ err: err.message }, 'Failed to replay DLQ jobs');
        res.status(500).json({ success: false, error: err.message });
    }
});

// ⏸️ Pause a Queue
router.post('/queues/:name/pause', verifyToken, checkRole(['super_admin']), async (req, res) => {
    try {
        const queue = new Queue(req.params.name, { connection: getRedisConnection() });
        await queue.pause();
        logger.warn({ queue: req.params.name }, `⏸️ Queue Paused`);
        res.json({ success: true, message: `Queue ${req.params.name} paused` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ▶️ Resume a Queue
router.post('/queues/:name/resume', verifyToken, checkRole(['super_admin']), async (req, res) => {
    try {
        const queue = new Queue(req.params.name, { connection: getRedisConnection() });
        await queue.resume();
        logger.info({ queue: req.params.name }, `▶️ Queue Resumed`);
        res.json({ success: true, message: `Queue ${req.params.name} resumed` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
