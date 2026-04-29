const { Queue, Worker } = require('bullmq');
const { executeCode } = require('../services/judge0');
const { getRedisConnection } = require('../config/redis');

// 🚀 Use the shared singleton connection
const connection = getRedisConnection();

// 1. Initialize Queue (Producer)
const codeEvaluationQueue = new Queue('CodeEvaluation', { 
    connection
});

const { codeGradingPayloadSchema } = require('../validations/queue.schema');

/**
 * Adds a code evaluation job to the BullMQ queue.
 * @param {Object} jobData - { sourceCode, language, testCases, studentId, questionId }
 */
const addCodeEvaluationJob = async (jobData) => {
    // 🛡️ [PHASE 5] Input Governance: Validate before adding to Redis
    const validatedData = codeGradingPayloadSchema.parse(jobData);

    console.log(`[Queue] Adding job for Student: ${validatedData.studentId}, Question: ${validatedData.questionId}`);
    const job = await codeEvaluationQueue.add('evaluate', validatedData, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        timeout: 30000, // 30 seconds explicit timeout
        removeOnComplete: true,
        removeOnFail: { count: 100 } // Dead-letter queue (retains last 100 failed jobs)
    });
    return job;
};

// 2. Setup Worker (Consumer)
const setupCodeEvaluationWorker = (io) => {
    if (!io) {
        console.warn('⚠️ [Worker] Socket.IO instance missing. Worker results will not be broadcasted.');
    }

    const worker = new Worker('CodeEvaluation', async (job) => {
        try {
            const { sourceCode, language, testCases, studentId, questionId } = job.data;
            
            console.log(`[Worker] Started Evaluation: Student ${studentId} | Q: ${questionId}`);
            const results = [];
        let allPassed = true;

        // Process each test case against Judge0
        for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            try {
                const executionResult = await executeCode(sourceCode, language, tc.input);

                if (executionResult.success) {
                    const passed = executionResult.output.trim() === tc.expectedOutput.trim();
                    if (!passed) allPassed = false;
                    
                    results.push({ 
                        testCaseId: i + 1, 
                        passed, 
                        input: tc.isHidden ? 'Hidden' : tc.input,
                        expectedOutput: tc.isHidden ? 'Hidden' : tc.expectedOutput,
                        actualOutput: tc.isHidden ? 'Hidden' : executionResult.output 
                    });
                } else {
                    allPassed = false;
                    results.push({ 
                        testCaseId: i + 1, 
                        passed: false, 
                        error: executionResult.error,
                        status: executionResult.status
                    });
                    break;
                }
            } catch (err) {
                console.error(`[Worker] Judge0 Error on TC ${i+1}:`, err.message);
                allPassed = false;
                results.push({ testCaseId: i + 1, passed: false, error: 'Internal Grading Error' });
                break;
            }
        }

        // Final result broadcast
        if (io) {
            io.to(`user_${studentId}`).emit('code_evaluation_result', {
                questionId,
                allPassed,
                results,
                timestamp: new Date()
            });
        }

        return { allPassed, results };
        } catch (error) {
            console.error(`[Worker] Fatal Error in Code Evaluation Job ${job.id}:`, error.message);
            throw error; // Throwing triggers BullMQ retry mechanism
        }
    }, { 
        connection,
        concurrency: 5 
    });

    worker.on('completed', (job) => {
        console.log(`✅ [Worker] Job ${job.id} completed for student ${job.data.studentId}`);
    });

    worker.on('failed', (job, err) => {
        console.error(`❌ [Worker] Job ${job.id} failed after ${job.attemptsMade} attempts. Error:`, err.message);
        if (job.attemptsMade >= 3 && io) {
            io.to(`user_${job.data.studentId}`).emit('code_evaluation_error', {
                questionId: job.data.questionId,
                message: 'Your code evaluation failed after multiple attempts. Please contact support if the issue persists.'
            });
        }
    });

    return worker;
};

module.exports = { addCodeEvaluationJob, setupCodeEvaluationWorker };
