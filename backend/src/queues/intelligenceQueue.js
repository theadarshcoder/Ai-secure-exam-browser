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
            removeOnComplete: true,
            removeOnFail: { count: 100 },
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 }
        });
        console.log(`📡 Intelligence Queue: Job added for student ${studentId}`);
    } catch (err) {
        console.error('⚠️ Intelligence Queue error:', err.message);
    }
};

module.exports = { intelligenceQueue, addIntelligenceJob };
