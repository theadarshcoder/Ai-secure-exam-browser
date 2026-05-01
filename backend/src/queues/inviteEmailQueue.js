// ═══════════════════════════════════════════════════════════
//  📨 Invite Email Queue — BullMQ
//  Handles bulk email sending via background workers.
//  Uses addBulk for batch processing (Edge Case Fix #3).
// ═══════════════════════════════════════════════════════════

const { Queue, Worker } = require('bullmq');
const { sendInviteEmail } = require('../services/emailService');
const ExamInvite = require('../models/ExamInvite');
const { getRedisConnection } = require('../config/redis');

// 🚀 Use the shared singleton connection
const connection = getRedisConnection();

// ─── Queue (Producer) ────────────────────────────────────
const inviteEmailQueue = new Queue('InviteEmail', {
    connection
});


/**
 * Add multiple invite email jobs in a single Redis transaction.
 * Edge Case Fix #3: Uses addBulk instead of individual adds.
 * 
 * @param {Array} jobs - Array of { inviteId, email, studentName, password, examName, verifyLink, expiresAt }
 */
const addBulkInviteJobs = async (jobs) => {
    const bulkJobs = jobs.map(job => ({
        name: 'sendInviteEmail',
        data: job,
        opts: {
            attempts: 5,
            backoff: { type: 'exponential', delay: 2000 },
            timeout: 10000, // 10s explicit timeout per email
            removeOnComplete: true,  // Auto cleanup from Redis memory
            removeOnFail: { count: 200 } // Keep last 200 failed jobs for debugging (DLQ)
        }
    }));

    await inviteEmailQueue.addBulk(bulkJobs);
    console.log(`📨 [Queue] ${bulkJobs.length} invite email jobs added (addBulk)`);
};

// ─── Worker (Consumer) ───────────────────────────────────
const setupInviteEmailWorker = () => {
    const worker = new Worker('InviteEmail', async (job) => {
        const { inviteId, email, studentName, password, examName, verifyLink, expiresAt } = job.data;
        
        console.log(`📧 [Worker] Processing invite for: ${email}`);

        const result = await sendInviteEmail({
            to: email,
            studentName,
            password,
            examName,
            verifyLink,
            expiresAt
        });

        // Update ExamInvite status based on email delivery
        if (result.success) {
            await ExamInvite.findByIdAndUpdate(inviteId, {
                status: 'sent',
                sentAt: new Date()
            });
            console.log(`✅ [Worker] Email sent to ${email}`);
        } else {
            // Mark as failed only on final attempt
            if (job.attemptsMade + 1 >= job.opts.attempts) { 
                await ExamInvite.findByIdAndUpdate(inviteId, {
                    status: 'failed'
                });
            }
            throw new Error(`Email delivery failed: ${result.error}`);
        }

        return result;
    }, {
        connection,
        concurrency: 3  // Process 3 emails in parallel (Resend free tier friendly)
    });


    worker.on('completed', (job) => {
        console.log(`✅ [Invite Worker] Job ${job.id} completed for ${job.data.email}`);
    });

    worker.on('failed', (job, err) => {
        console.error(`❌ [Invite Worker] Job ${job.id} failed (attempt ${job.attemptsMade}): ${err.message}`);
    });

    console.log('📨 [Invite Worker] Email worker initialized and ready.');
    return worker;
};

module.exports = { inviteEmailQueue, addBulkInviteJobs, setupInviteEmailWorker };
