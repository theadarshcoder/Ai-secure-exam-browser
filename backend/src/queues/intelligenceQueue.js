const { Queue } = require('bullmq');
const { getRedisConnection } = require('../config/redis');

// 🚀 Use the shared singleton connection
const connection = getRedisConnection();

const intelligenceQueue = new Queue('intelligence_queue', { connection });


/**
 * 🚀 Add job to pre-calculate student intelligence
 * @param {string} studentId 
 */
const addIntelligenceJob = async (studentId) => {
    try {
        await intelligenceQueue.add('update_student_stats', { studentId }, {
            jobId: `intelligence-${studentId}`, // 🛡️ Deduplication: same student won't queue twice
            removeOnComplete: true,
            removeOnFail: { count: 100 },
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
            timeout: 60000, // 60 seconds explicit timeout
            delay: 2000 // Wait 2s for DB writes to settle before cache warming
        });
        console.log(`📡 Intelligence Queue: Job added for student ${studentId}`);
    } catch (err) {
        console.error('⚠️ Intelligence Queue error:', err.message);
    }
};

module.exports = { intelligenceQueue, addIntelligenceJob };
