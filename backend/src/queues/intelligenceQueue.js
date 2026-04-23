const { Queue } = require('bullmq');

const REDIS_OPTIONS = {
    connection: {
        url: process.env.REDIS_URL || 'redis://127.0.0.1:6373',
    }
};

const intelligenceQueue = new Queue('intelligence_queue', REDIS_OPTIONS);

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
