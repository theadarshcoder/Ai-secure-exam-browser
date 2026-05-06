const Exam = require('../models/Exam');
const ExamSession = require('../models/ExamSession');
const ExamAnswer = require('../models/ExamAnswer');
const ExamInvite = require('../models/ExamInvite');
const { getRedisClient } = require('../config/redis');
const { gradeMCQ, gradeCoding, gradeShortAnswer } = require('./gradingService');
const { clearCache } = require('./cacheService');

/**
 * Process a submission and grade all answers
 * @param {Object} session - The ExamSession mongoose document
 * @param {Object} exam - The Exam mongoose document
 * @param {Object} answers - Optional payload of final answers
 * @param {Boolean} isLateSubmission - True if submitted after deadline (drops payload and forces auto-submit)
 * @returns {Object} { status, score, totalMarks, percentage, passed, requiresManualGrading, summaryResults }
 */
const processSubmission = async (session, exam, answers, isLateSubmission = false) => {
    // 🚀 Redis Final Merge Logic
    const redisClient = getRedisClient();
    let finalAnswers = answers || {};
    if (redisClient) {
        try {
            const cacheKey = `exam_session:${exam._id}:${session.student}`;
            const cachedData = await redisClient.hgetall(cacheKey);
            if (cachedData && cachedData.answers) {
                try {
                    const redisAnswers = JSON.parse(cachedData.answers);
                    if (isLateSubmission) {
                        // 🛡️ Discard late payload, use only what was previously auto-saved
                        finalAnswers = redisAnswers || {};
                    } else if (redisAnswers && typeof redisAnswers === 'object') {
                        // Normal merge
                        finalAnswers = { ...redisAnswers, ...finalAnswers };
                    }
                } catch (parseErr) {
                    console.error('⚠️ Redis Answers parse failed in processSubmission:', parseErr.message);
                }
            } else if (isLateSubmission) {
                // Late submission and no Redis backup = zero answers accepted
                finalAnswers = {};
            }
            await redisClient.del(cacheKey); // Clean up hash
        } catch (redisErr) {
            console.warn('⚠️ Redis error during submission merge:', redisErr.message);
        }
    }

    // ─── Evaluate Each Question ──────────────────────
    const answerBulkOps = [];
    const summaryResults = [];
    let autoScore = 0;
    let hasShortAnswers = false;

    for (let index = 0; index < exam.questions.length; index++) {
        const q = exam.questions[index];
        const qId = q._id.toString();

        if (typeof q.marks !== 'number' || q.marks < 0) {
            console.error(`[SECURITY] Invalid question marks configuration for exam ${exam._id}, question ${qId}`);
            throw new Error(`Invalid exam configuration: Question ${index + 1} has invalid marks.`);
        }

        const studentAnswer = finalAnswers[qId] !== undefined ? finalAnswers[qId] : finalAnswers[String(index)];
        let evaluation = { marksObtained: 0, status: 'not_answered', result: {} };

        if (studentAnswer !== undefined && studentAnswer !== null) {
            if (q.type === 'mcq') {
                evaluation = gradeMCQ(q, studentAnswer);
                autoScore += evaluation.marksObtained;
            } else if (q.type === 'coding') {
                try {
                    const codeToGrade = (studentAnswer && typeof studentAnswer === 'object') ? studentAnswer.code : studentAnswer;
                    evaluation = await gradeCoding(q, codeToGrade);
                    autoScore += evaluation.marksObtained;
                } catch (err) {
                    evaluation = { 
                        marksObtained: 0, maxMarks: q.marks || 1, status: 'pending_review', 
                        result: { error: 'Grading Service Unavailable' } 
                    };
                    hasShortAnswers = true;
                }
            } else if (q.type === 'short') {
                hasShortAnswers = true;
                try {
                    evaluation = await gradeShortAnswer(q, studentAnswer);
                } catch (err) {
                    evaluation = { 
                        marksObtained: 0, maxMarks: q.marks || 1, status: 'pending_review',
                        result: { error: 'AI Service Unavailable' }
                    };
                }
            } else if (q.type === 'frontend-react') {
                const existingAnswer = await ExamAnswer.findOne({ sessionId: session._id, questionId: qId });
                if (existingAnswer && existingAnswer.frontendResult) {
                    evaluation = {
                        marksObtained: existingAnswer.frontendResult.score || 0,
                        maxMarks: q.marks || existingAnswer.frontendResult.maxMarks || 0,
                        status: existingAnswer.frontendResult.passed ? 'correct' : 'incorrect',
                        result: existingAnswer.frontendResult
                    };
                    autoScore += evaluation.marksObtained;
                } else {
                    hasShortAnswers = true;
                    evaluation = {
                        marksObtained: 0,
                        maxMarks: q.marks || 0,
                        status: 'pending_review',
                        result: { message: 'UI Verification Pending' }
                    };
                }
            }
        }

        answerBulkOps.push({
            updateOne: {
                filter: { sessionId: session._id, questionId: qId },
                update: {
                    $set: {
                        answer: (studentAnswer && typeof studentAnswer === 'object') ? studentAnswer.answer : studentAnswer,
                        code: (studentAnswer && typeof studentAnswer === 'object') ? studentAnswer.code : undefined,
                        marksObtained: evaluation.marksObtained,
                        maxMarks: q.marks || evaluation.maxMarks || 0,
                        status: evaluation.status,
                        result: evaluation
                    }
                },
                upsert: true
            }
        });

        summaryResults.push({
            questionIndex: index,
            type: q.type,
            marksObtained: evaluation.marksObtained,
            maxMarks: q.marks || evaluation.maxMarks || 0,
            status: evaluation.status
        });
    }

    if (answerBulkOps.length > 0) {
        await ExamAnswer.bulkWrite(answerBulkOps);
    }

    // ─── Calculate Score ──────────────────────
    const totalMarksVal = Number(exam.totalMarks) || 1;
    const percentage = Math.round((autoScore / totalMarksVal) * 100) || 0;
    const passed = percentage >= (Number(exam.passingMarks) || 40);

    // ─── 🛡️ Zero-Trust Behavioral Anomaly Detection ────────
    const timeTakenSeconds = Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000);
    const totalQuestions = exam.questions ? exam.questions.length : 0;
    
    let speedAnomalyFlag = false;
    if (totalQuestions > 0 && (timeTakenSeconds / totalQuestions) < 5) {
        speedAnomalyFlag = true;
    }

    const heartbeatInterval = 30;
    const expectedHeartbeats = Math.max(1, Math.floor(timeTakenSeconds / heartbeatInterval));
    const actualHeartbeats = session.heartbeatCount || 0;
    const telemetryRatio = actualHeartbeats / expectedHeartbeats;
    
    let missingTelemetryScore = 0;
    if (telemetryRatio < 0.1) missingTelemetryScore = 20;
    else if (telemetryRatio < 0.3) missingTelemetryScore = 10;
    
    if ((session.maxHeartbeatGap || 0) > 300000) {
        missingTelemetryScore += 10;
    }

    let perfectScoreAnomaly = false;
    if (percentage > 95 && speedAnomalyFlag && (session.violations.length === 0 || telemetryRatio < 0.5)) {
        perfectScoreAnomaly = true;
    }

    const riskScoreRaw = 
        (session.tabSwitchCount * 2) +
        (session.violations.length * 5) +
        missingTelemetryScore +
        (speedAnomalyFlag ? 20 : 0) +
        (perfectScoreAnomaly ? 15 : 0);

    const riskScore = Math.min(riskScoreRaw, 100);
    
    let riskLevel = 'LOW';
    if (riskScore >= 60) riskLevel = 'CRITICAL';
    else if (riskScore >= 30) riskLevel = 'HIGH';
    else if (riskScore >= 10) riskLevel = 'MEDIUM';

    session.riskScore = riskScore;
    session.riskLevel = riskLevel;

    const finalStatus = hasShortAnswers ? 'pending_review' : (isLateSubmission ? 'auto_submitted' : 'submitted');

    session.score = Number(autoScore) || 0;
    session.totalMarks = Number(totalMarksVal) || 1;
    session.percentage = Number(percentage) || 0;
    session.passed = hasShortAnswers ? false : passed;
    
    // 🛡️ Preserve 'blocked' status if the student was disqualified
    if (session.status === 'blocked' || session.isBlocked) {
        session.status = 'blocked';
    } else {
        session.status = finalStatus;
    }
    
    session.requiresManualGrading = hasShortAnswers;
    session.submittedAt = new Date();
    await session.save();

    ExamInvite.findOneAndUpdate(
        { exam: exam._id, student: session.student, status: { $in: ['exam_started', 'opened'] } },
        { status: 'completed' }
    ).catch(err => console.error('[Invite] Status update (completed) failed:', err.message));

    await clearCache(`active_exams_user_${session.student}`);

    const { addIntelligenceJob } = require('../queues/intelligenceQueue');
    await addIntelligenceJob(session.student);

    return {
        status: session.status,
        score: session.score,
        totalMarks: session.totalMarks,
        percentage: session.percentage,
        passed: session.passed,
        requiresManualGrading: session.requiresManualGrading,
        summaryResults
    };
};

module.exports = {
    processSubmission
};
