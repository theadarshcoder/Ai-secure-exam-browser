const { Queue, Worker } = require('bullmq');
const { evaluateFrontendCode } = require('../services/frontendGradingService');
const { getRedisConnection } = require('../config/redis');

// 🚀 Use the shared singleton connection
const connection = getRedisConnection();

// 1. Initialize Queue (Producer)
const frontendEvaluationQueue = new Queue('FrontendEvaluation', { 
    connection 
});


const { frontendGradingPayloadSchema } = require('../validations/queue.schema');

/**
 * Adds a frontend evaluation job to the BullMQ queue.
 * @param {Object} jobData - { codeFiles, testCases, studentId, questionId }
 */
const addFrontendEvaluationJob = async (jobData) => {
    // 🛡️ [PHASE 5] Input Governance: Validate before adding to Redis
    const validatedData = frontendGradingPayloadSchema.parse(jobData);

    console.log(`[Queue] Adding Frontend job for Student: ${validatedData.studentId}, Question: ${validatedData.questionId}`);
    const job = await frontendEvaluationQueue.add('evaluate-ui', validatedData, {
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

    // 🛡️ Phase 3: Grading Resilience — Added 30s timeout
    const worker = new Worker('FrontendEvaluation', async (job) => {
        // 🛡️ Contract Fix: Extracting from versioned payload
        const { codeFiles, testCases, studentId, questionId, version, requestId } = job.data;
        
        console.log(`📡 [Grading][${requestId || 'N/A'}] Worker Started: Student ${studentId} | Q: ${questionId} | Contract V${version || 0}`);
        
        try {
            // Worker is "thin" — no DB calls, just computation
            const result = await evaluateFrontendCode(codeFiles, testCases);

            console.log(`✅ [Grading][${requestId || 'N/A'}] Evaluation complete for ${studentId}. Emitting to user_${studentId}`);

            // Final result broadcast to student's private socket room (using DB ID)
            if (io) {
                io.to(`user_${studentId}`).emit('code_evaluation_result', {
                    questionId,
                    type: 'frontend-react',
                    ...result,
                    requestId,
                    timestamp: new Date()
                });
            }

            return result;
        } catch (err) {
            console.error(`❌ [Grading][${requestId || 'N/A'}] Worker Error for Student ${studentId}:`, err.message);
            if (io) {
                io.to(`user_${studentId}`).emit('code_evaluation_error', {
                    questionId,
                    requestId,
                    message: 'Frontend evaluation failed or timed out. Please try again.'
                });
            }
            throw err;
        }
    }, {
        connection: getRedisConnection(),
        concurrency: 5,
        lockDuration: 35000 // Slightly longer than job timeout
    });

    worker.on('completed', (job) => {
        console.log(`✅ [Grading][${job.data.requestId || job.id}] Completed successfully.`);
    });

    worker.on('failed', (job, err) => {
        console.error(`❌ [Grading][${job.data.requestId || job.id}] Failed. Reason:`, err.message);
    });

    return worker;
};

module.exports = { addFrontendEvaluationJob, setupFrontendEvaluationWorker };
