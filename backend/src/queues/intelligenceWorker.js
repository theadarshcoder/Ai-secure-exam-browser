const { Worker } = require('bullmq');
const { setCache, clearPattern } = require('../services/cacheService');
const { getRedisConnection } = require('../config/redis');
const { computeStudentIntelligence } = require('../services/intelligenceService');

// 🚀 Use the shared singleton connection
const connection = getRedisConnection();


/**
 * 🛠️ Intelligence Worker — Cache Warmer
 * 
 * PURPOSE: Pre-compute page-1 intelligence data AFTER exam submission
 * so the next admin dashboard visit gets an instant cache hit.
 * 
 * IMPORTANT: This worker does NOT duplicate the controller's work.
 * Both use the shared `computeStudentIntelligence()` function
 * and write to the SAME cache key format.
 */
const startIntelligenceWorker = (concurrency = 3) => {
    const worker = new Worker('intelligence_queue', async (job) => {
        const { trackQueueMetric } = require('../utils/monitor');
        const startProcessing = Date.now();
        const waitTime = startProcessing - job.timestamp;

        const { studentId } = job.data;
        if (!studentId) return;

        try {
            console.log(`🧠 Worker: Pre-warming intelligence cache for student ${studentId}... (Wait: ${waitTime}ms)`);
            
            // 1. Invalidate ALL stale cached pages for this student
            await clearPattern(`student_intelligence:${studentId}:*`);

            // 2. Pre-compute page 1 (most commonly viewed) using shared service
            const result = await computeStudentIntelligence(studentId, 1, 10);

            // 3. Cache with same key format the controller reads
            const cacheKey = `student_intelligence:${studentId}:p1`;
            await setCache(cacheKey, result, 300); // 5 min TTL

            console.log(`✅ Worker: Intelligence cache warmed for student ${studentId}`);
        } catch (err) {
            console.error(`❌ Worker error for student ${studentId}:`, err.message);
            // We still track metrics even if it failed, to see how long it took to fail
            throw err; // Let BullMQ retry
        } finally {
            const processTime = Date.now() - startProcessing;
            await trackQueueMetric('Intelligence', waitTime, processTime);
        }
    }, { 
        connection,
        concurrency: parseInt(concurrency), 
        limiter: {
            max: 50, // 🏎️ Increased for load testing
            duration: 1000 
        }
    });

    worker.on('failed', (job, err) => {
        console.error(`💥 Job ${job.id} failed:`, err.message);
    });

    console.log('🤖 Intelligence Worker is active and listening for jobs.');
    return worker;
};

module.exports = { startIntelligenceWorker };
