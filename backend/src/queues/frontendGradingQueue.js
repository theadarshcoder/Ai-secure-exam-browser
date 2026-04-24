const { Queue, Worker } = require('bullmq');
const { evaluateFrontendCode } = require('../services/frontendGradingService');
const { getRedisConnection } = require('../config/redis');

// 🚀 Use the shared singleton connection
const connection = getRedisConnection();

// 1. Initialize Queue (Producer)
const frontendEvaluationQueue = new Queue('FrontendEvaluation', { 
    connection 
});


/**
 * Adds a frontend evaluation job to the BullMQ queue.
 * @param {Object} jobData - { codeFiles, testCases, studentId, questionId }
 */
const addFrontendEvaluationJob = async (jobData) => {
    console.log(`[Queue] Adding Frontend job for Student: ${jobData.studentId}, Question: ${jobData.questionId}`);
    const job = await frontendEvaluationQueue.add('evaluate-ui', jobData, {
        attempts: 1, // No retries for frontend grading to avoid infinite loops hanging the queue
        removeOnComplete: true,
        removeOnFail: false
    });
    return job;
};

// 2. Setup Worker (Consumer)
const setupFrontendEvaluationWorker = (io) => {
    if (!io) {
        console.warn('⚠️ [Worker] Socket.IO instance missing. Frontend worker results will not be broadcasted.');
    }

    const worker = new Worker('FrontendEvaluation', async (job) => {
        const { codeFiles, testCases, studentId, questionId } = job.data;
        
        console.log(`[Worker] Started Frontend Evaluation: Student ${studentId} | Q: ${questionId}`);
        
        try {
            const result = await evaluateFrontendCode(codeFiles, testCases);

            // Final result broadcast to student's private socket room
            if (io) {
                io.to(`user_${studentId}`).emit('code_evaluation_result', {
                    questionId,
                    type: 'frontend-react',
                    ...result,
                    timestamp: new Date()
                });
            }

            return result;
        } catch (err) {
            console.error(`[Worker] Frontend Grading Error:`, err.message);
            if (io) {
                io.to(`user_${studentId}`).emit('code_evaluation_error', {
                    questionId,
                    message: 'Frontend evaluation failed due to an internal error.'
                });
            }
            throw err;
        }
    }, { 
        connection,
        concurrency: 3, // Lower concurrency for frontend as JSDOM/Babel are heavier
        lockDuration: 10000 // 10 seconds lock
    });


    worker.on('completed', (job) => {
        console.log(`✅ [Worker] Frontend Job ${job.id} completed for student ${job.data.studentId}`);
    });

    worker.on('failed', (job, err) => {
        console.error(`❌ [Worker] Frontend Job ${job.id} failed. Error:`, err.message);
    });

    return worker;
};

module.exports = { addFrontendEvaluationJob, setupFrontendEvaluationWorker };
