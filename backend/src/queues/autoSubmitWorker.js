const { Worker, Queue } = require('bullmq');
const ExamSession = require('../models/ExamSession');
const Exam = require('../models/Exam');
const AuditLog = require('../models/AuditLog');
const { processSubmission } = require('../services/submissionService');
const mongoose = require('mongoose');

// Define connection for BullMQ
const connection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined
};

const AUTO_SUBMIT_QUEUE_NAME = 'AutoSubmitQueue';
const autoSubmitQueue = new Queue(AUTO_SUBMIT_QUEUE_NAME, { connection });

let autoSubmitWorker;

/**
 * Add a repeatable job to scan for expired sessions
 */
const startAutoSubmitWorker = async (io) => {
    console.log('⏳ Starting Auto-Submit Worker (runs every 60 seconds)');

    // Ensure only one repeatable job is running
    await autoSubmitQueue.add(
        'scanExpiredSessions',
        {},
        {
            repeat: {
                every: 60000, // every 60 seconds
                jobId: 'scanExpiredSessionsJob' // static ID prevents duplicates
            }
        }
    );

    autoSubmitWorker = new Worker(
        AUTO_SUBMIT_QUEUE_NAME,
        async (job) => {
            if (job.name === 'scanExpiredSessions') {
                return await processExpiredSessions(io);
            }
        },
        { connection }
    );

    autoSubmitWorker.on('completed', (job, returnvalue) => {
        if (returnvalue && returnvalue.count > 0) {
            console.log(`✅ [Auto-Submit] Successfully processed ${returnvalue.count} expired sessions.`);
        }
    });

    autoSubmitWorker.on('failed', (job, err) => {
        console.error(`❌ [Auto-Submit] Worker failed: ${err.message}`);
    });

    return autoSubmitWorker;
};

/**
 * Scan the database for expired sessions and process them atomically
 */
const processExpiredSessions = async (io) => {
    const now = new Date();

    // Find sessions that have expired but are still in progress or paused
    const expiredSessions = await ExamSession.find({
        status: { $in: ['in_progress', 'paused'] },
        endTime: { $lte: now }
    }).select('_id exam student');

    if (!expiredSessions || expiredSessions.length === 0) {
        return { count: 0 };
    }

    let processedCount = 0;

    for (const sessionDoc of expiredSessions) {
        // Atomic update to lock the session for processing
        // This prevents race conditions if the student tries to submit at the exact same time
        const lockedSession = await ExamSession.findOneAndUpdate(
            { _id: sessionDoc._id, status: { $in: ['in_progress', 'paused'] } },
            { $set: { status: 'auto_submitted', submittedAt: now } },
            { new: true } // Return the updated document
        );

        if (!lockedSession) {
            // Another process (or manual submit) already handled this session
            continue;
        }

        try {
            // Load full exam details
            const exam = await Exam.findById(lockedSession.exam);
            if (!exam) {
                console.error(`[Auto-Submit] Exam not found for session ${lockedSession._id}`);
                continue;
            }

            // Reuse the core grading logic
            // isLateSubmission = true to drop any late payloads and rely purely on Redis
            await processSubmission(lockedSession, exam, {}, true);

            // Log the action securely
            await AuditLog.create({
                performedBy: lockedSession.student,
                action: 'AUTO_SUBMIT',
                targetUserId: lockedSession.student,
                details: { examId: exam._id, method: 'cron' }
            });

            // Notify connected client if applicable
            if (io) {
                io.to(lockedSession.student.toString()).emit('force_auto_submit', {
                    examId: exam._id,
                    message: 'Your exam time has expired and has been automatically submitted.'
                });
            }

            processedCount++;
            console.log(`🎯 [Auto-Submit] Processed expired session: ${lockedSession._id}`);
        } catch (error) {
            console.error(`[Auto-Submit] Error processing session ${lockedSession._id}:`, error);
            // Even if processing fails, status is already 'auto_submitted' so it won't loop infinitely
        }
    }

    return { count: processedCount };
};

module.exports = {
    startAutoSubmitWorker
};
