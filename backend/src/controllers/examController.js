const Exam = require('../models/Exam');
const ExamSession = require('../models/ExamSession');
const ExamAnswer = require('../models/ExamAnswer');
const ExamInvite = require('../models/ExamInvite');
const User = require('../models/User');
const { getRedisClient } = require('../config/redis');
const { executeCode } = require('../services/judge0');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { getTimeAgo, parseLeetCode, parseCodeChef } = require('../utils/helpers');
const { gradeMCQ, gradeCoding, gradeShortAnswer, wrapStudentCode } = require('../services/gradingService');
const { addCodeEvaluationJob } = require('../queues/codeGradingQueue');
const { addFrontendEvaluationJob } = require('../queues/frontendGradingQueue');
const { getCache, setCache, clearCache, clearPattern, TTL_API_CACHE } = require('../services/cacheService');
const Setting = require('../models/Setting');
const { verifySecureRequest } = require('../utils/securityUtils');
const { VIOLATION_TYPES, SESSION_STATUS } = require('../utils/constants');

// ─────────────── POST /api/exams/create ───────────────
// Mentor/Admin creates a new exam and saves it to MongoDB
exports.createExam = asyncHandler(async (req, res) => {
    const { title, category, duration, totalMarks, passingMarks, questions, scheduledDate, status, negativeMarks } = req.body;

    const isDraft = status === 'draft';

    // Validation: Required for published, but drafts can be empty-ish
    if (!title || !duration) {
        res.status(400);
        throw new Error('Title and duration are required.');
    }

    // Time limit constraints
    if (duration < 5 || duration > 300) {
        res.status(400);
        throw new Error('Exam duration must be between 5 and 300 minutes.');
    }

    // Filter out completely empty questions from drafts to avoid mongoose crashes
    let validQuestions = questions || [];
    if (isDraft) {
        validQuestions = validQuestions.filter(q => q && q.questionText && q.questionText.trim() !== '');
    }

    if (!isDraft && (!validQuestions || validQuestions.length === 0)) {
        res.status(400);
        throw new Error('At least 1 question is required to publish an exam.');
    }

    // Question Type & Marks Validation
    const allowedTypes = ['mcq', 'short', 'coding', 'frontend-react'];
    const negMarks = Number(negativeMarks) || 0;

    if (negMarks < 0) {
        res.status(400);
        throw new Error('Negative marks cannot be less than 0.');
    }

    for (const q of validQuestions) {
        if (!q.type || !allowedTypes.includes(q.type)) {
            res.status(400);
            throw new Error(`Invalid question type: ${q.type || 'missing'}. Allowed types: ${allowedTypes.join(', ')}`);
        }
        if (Number(q.marks) <= 0) {
            res.status(400);
            throw new Error('Question marks must be greater than 0.');
        }
        if (negMarks > Number(q.marks)) {
            res.status(400);
            throw new Error(`Negative marks (${negMarks}) cannot exceed question marks (${q.marks}).`);
        }
    }

    // 🛡️ Fix 35: Auto-correct passing marks (UX improvement)
    let finalPassingMarks = passingMarks || 40;
    const calcTotalMarks = totalMarks || (validQuestions ? validQuestions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0) : 0);
    if (finalPassingMarks > calcTotalMarks) {
        console.warn(`[Logic Fix] Exam '${title}': passingMarks (${finalPassingMarks}) > totalMarks (${calcTotalMarks}). Auto-correcting to 40%.`);
        finalPassingMarks = Math.floor(calcTotalMarks * 0.4);
    }

    const exam = new Exam({
        title,
        category: category || 'General',
        duration,
        totalMarks: calcTotalMarks,
        passingMarks: finalPassingMarks,
        negativeMarks: negMarks,
        questions: validQuestions,
        creator: req.user.id,
        status: status || 'published',
        scheduledDate: (scheduledDate && !isNaN(new Date(scheduledDate).getTime())) 
            ? new Date(scheduledDate) 
            : new Date()
    });

    await exam.save();

    res.status(201).json({
        message: 'Exam Created!',
        id: exam._id,
        title: exam.title,
        status: exam.status,
        questionsCount: exam.questions.length,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        scheduledDate: exam.scheduledDate
    });
});

// ─────────────── PUT /api/exams/update/:id ───────────────
// Mentor/Admin updates an existing exam (e.g. from draft to published)
exports.updateExam = asyncHandler(async (req, res) => {
    const examId = req.params.id;
    let { title, category, duration, totalMarks, passingMarks, questions, scheduledDate, status, negativeMarks } = req.body;

    const exam = await Exam.findById(examId);

    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }

    // Only creator or admin can update
    if (exam.creator.toString() !== req.user.id && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('You do not have permission to update this exam.');
    }

    const isDraft = status === 'draft';

    // Validation
    if (!title || !duration) {
        res.status(400);
        throw new Error('Title and duration are required.');
    }

    // Time limit constraints
    if (duration < 5 || duration > 300) {
        res.status(400);
        throw new Error('Exam duration must be between 5 and 300 minutes.');
    }

    let validQuestions = questions || [];
    if (isDraft) {
        validQuestions = validQuestions.filter(q => q && q.questionText && q.questionText.trim() !== '');
    }

    if (!isDraft && (!validQuestions || validQuestions.length === 0)) {
        res.status(400);
        throw new Error('At least 1 question is required to publish an exam.');
    }

    // Question Type & Marks Validation
    const allowedTypes = ['mcq', 'short', 'coding', 'frontend-react'];
    const negMarks = Number(negativeMarks) || 0;

    if (negMarks < 0) {
        res.status(400);
        throw new Error('Negative marks cannot be less than 0.');
    }

    for (const q of validQuestions) {
        if (!q.type || !allowedTypes.includes(q.type)) {
            res.status(400);
            throw new Error(`Invalid question type: ${q.type || 'missing'}. Allowed types: ${allowedTypes.join(', ')}`);
        }
        if (Number(q.marks) <= 0) {
            res.status(400);
            throw new Error('Question marks must be greater than 0.');
        }
        if (negMarks > Number(q.marks)) {
            res.status(400);
            throw new Error(`Negative marks (${negMarks}) cannot exceed question marks (${q.marks}).`);
        }
    }
    
    // 🛡️ Fix 35: Auto-correct passing marks (UX improvement)
    if (passingMarks > totalMarks) {
        console.warn(`[Logic Fix] Auto-correcting passingMarks for exam ${examId}`);
        passingMarks = Math.floor(totalMarks * 0.4);
    }

    const oldDuration = exam.duration;
    
    exam.title = title;
    exam.category = category || exam.category;
    exam.duration = duration;
    exam.totalMarks = totalMarks || (validQuestions ? validQuestions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0) : 0);
    exam.passingMarks = passingMarks || exam.passingMarks;
    exam.negativeMarks = negMarks;
    exam.questions = validQuestions;
    exam.status = status || exam.status;
    if (scheduledDate && !isNaN(new Date(scheduledDate).getTime())) {
        exam.scheduledDate = new Date(scheduledDate);
    }

    await exam.save();

    // ⚡ Real-time Sync: If duration increased, extend time for all live sessions
    if (duration > oldDuration) {
        const extraMinutes = duration - oldDuration;
        const extraSeconds = extraMinutes * 60;
        
        const ExamSession = require('../models/ExamSession'); // Lazy load
        await ExamSession.updateMany(
            { exam: examId, status: 'in_progress' },
            { $inc: { remainingTimeSeconds: extraSeconds } }
        );

        const io = req.app.get('io');
        if (io) {
            io.to(`exam_${examId}`).emit('time_extended', {
                extraSeconds,
                extraMinutes,
                serverSyncTime: Date.now()
            });
        }
    }

    res.json({ message: 'Exam updated successfully', exam });
});

// ─────────────── PUT /api/exams/:id/publish-results ───────────────
// Admin/Mentor toggles whether students can view detailed results
exports.togglePublishResults = asyncHandler(async (req, res) => {
    const examId = req.params.id;
    const { resultsPublished } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }

    if (exam.creator.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_mentor') {
        res.status(403);
        throw new Error('You do not have permission to modify this exam.');
    }

    exam.resultsPublished = Boolean(resultsPublished);
    await exam.save();

    // ⚡ CRITICAL: Clear all student dashboard caches to reflect result visibility change immediately
    await clearPattern('active_exams_user_*');

    res.json({ 
        message: exam.resultsPublished ? 'Results published to students.' : 'Results hidden from students.', 
        resultsPublished: exam.resultsPublished 
    });
});

// ─────────────── DELETE /api/exams/:id ───────────────
// Mentor/Admin deletes an exam
exports.deleteExam = asyncHandler(async (req, res) => {
    const examId = req.params.id;

    const exam = await Exam.findById(examId);

    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }

    // Only creator or admin can delete
    if (exam.creator.toString() !== req.user.id && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('You do not have permission to delete this exam.');
    }

    await Exam.findByIdAndDelete(examId);

    res.json({ message: 'Exam deleted successfully' });
});

// ─────────────── GET /api/exams/active ───────────────
// Students see all published exams they haven't submitted yet
exports.getActiveExams = asyncHandler(async (req, res) => {
    const studentId = req.user.id;
    const cacheKey = `active_exams_user_${studentId}`;
    
    // Check Cache
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const exams = await Exam.find({ status: 'published' })
        .select('title category duration totalMarks passingMarks scheduledDate questions creator resultsPublished')
        .populate('creator', 'name email')
        .sort({ scheduledDate: -1 })
        .lean(); // Faster lookup

    // Check which exams this student has already submitted (Any terminal status)
    const activeExamIds = exams.map(e => e._id);
    const submittedSessions = await ExamSession.find({ 
        student: studentId, 
        exam: { $in: activeExamIds }, 
        status: { $in: ['submitted', 'pending_review', 'reviewed', 'auto_submitted', 'blocked'] }
    }).select('exam').lean();
    const submittedExamIds = new Set(submittedSessions.map(s => s.exam.toString()));

    const globalSettings = await Setting.findOne() || {
        maxTabSwitches: 5,
        forceFullscreen: true,
        allowLateSubmissions: false,
        enableWebcam: true,
        disableCopyPaste: true,
        requireIDVerification: true
    };

    const result = exams.map(exam => ({
        id: exam._id,
        title: exam.title,
        category: exam.category,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        questionsCount: exam.questions.length,
        startTime: exam.scheduledDate,
        creator: exam.creator?.name || 'Unknown',
        alreadySubmitted: submittedExamIds.has(exam._id.toString()),
        resultsPublished: !!exam.resultsPublished,
        settings: globalSettings
    }));

    // Set Cache for 60s
    await setCache(cacheKey, result, TTL_API_CACHE);

    res.json(result);
});

// ─────────────── GET /api/exams/mentor-list ───────────────
// Mentors see exams THEY created + submission stats
exports.getMentorExams = asyncHandler(async (req, res) => {
    const mongoose = require('mongoose');
    
    // Admins and super mentors see all exams; regular mentors see their own
    const matchStage = (req.user.role === 'admin' || req.user.role === 'super_mentor')
        ? {}
        : { creator: new mongoose.Types.ObjectId(req.user.id) };

    const stats = await Exam.aggregate([
        { $match: matchStage },
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: 'users',
                localField: 'creator',
                foreignField: '_id',
                as: 'creatorInfo'
            }
        },
        {
            $unwind: {
                path: '$creatorInfo',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: 'examsessions',
                localField: '_id',
                foreignField: 'exam',
                as: 'sessions'
            }
        },
        {
            $project: {
                id: '$_id',
                name: '$title',
                category: '$category',
                status: { $cond: [{ $eq: ['$status', 'published'] }, 'live', 'draft'] },
                time: '$scheduledDate',
                questionsCount: { $size: '$questions' },
                duration: '$duration',
                totalMarks: '$totalMarks',
                students: { $size: '$sessions' },
                submitted: {
                    $size: {
                        $filter: {
                            input: '$sessions',
                            as: 's',
                            cond: { $eq: ['$$s.status', 'submitted'] }
                        }
                    }
                },
                flags: {
                    $size: {
                        $filter: {
                            input: '$sessions',
                            as: 's',
                            cond: { $gt: [{ $size: { $ifNull: ['$$s.violations', []] } }, 0] }
                        }
                    }
                },
                creatorName: { $ifNull: ['$creatorInfo.name', 'Unknown System'] },
                resultsPublished: '$resultsPublished'
            }
        }
    ]);

    res.json(stats);
});

// ─────────────── GET /api/exams/:id ───────────────
// Load exam for student (STRIPS correct answers for security)
exports.getExamById = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id)
        .select('-questions.correctOption -questions.expectedAnswer -questions.testCases.expectedOutput')
        .populate('creator', 'name');

    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }

    const sanitizedQuestions = exam.questions.map((q, index) => {
        const questionObject = q.toObject();
        const safe = {
            id: questionObject._id,
            index,
            type: questionObject.type,
            questionText: questionObject.questionText,
            marks: questionObject.marks,
        };
        if (questionObject.type === 'mcq') {
            safe.options = questionObject.options;
        }
        if (questionObject.type === 'short') {
            safe.maxWords = questionObject.maxWords;
        }
        if (questionObject.type === 'coding') {
            safe.language = questionObject.language;
            safe.initialCode = questionObject.initialCode;
            safe.testCases = (questionObject.testCases || []).map(tc => ({
                input: tc.isHidden ? 'Hidden Test Case' : tc.input,
                isHidden: !!tc.isHidden
            }));
        }
        return safe;
    });

    const globalSettings = await Setting.findOne() || {
        maxTabSwitches: 5,
        forceFullscreen: true,
        allowLateSubmissions: false,
        enableWebcam: true,
        disableCopyPaste: true,
        requireIDVerification: true
    };

    res.json({
        id: exam._id,
        title: exam.title,
        category: exam.category,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        startTime: exam.scheduledDate,
        creator: exam.creator?.name,
        questions: sanitizedQuestions,
        settings: globalSettings
    });
});

// ─────────────── GET /api/exams/mentor/:id ───────────────
// Load exam for mentor (INCLUDES full data for editing)
exports.getMentorExamById = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }

    if (exam.creator.toString() !== req.user.id && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('You do not have permission to view this exam details.');
    }

    res.json(exam);
});

// ─────────────── PATCH /api/exams/:id/status ───────────────
// Quick toggle exam status (draft -> published -> completed)
exports.updateExamStatus = asyncHandler(async (req, res) => {
    const examId = req.params.id;
    const { status } = req.body;

    if (!['draft', 'published', 'completed'].includes(status)) {
        res.status(400);
        throw new Error('Invalid status.');
    }

    const exam = await Exam.findById(examId);

    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }

    if (exam.creator.toString() !== req.user.id && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('You do not have permission to update this exam.');
    }

    if (status === 'published' && (!exam.questions || exam.questions.length === 0)) {
        res.status(400);
        throw new Error('Cannot publish an exam with no questions.');
    }

    exam.status = status;
    await exam.save();

    res.json({ message: `Exam status updated to ${status}`, examId, status });
});

// ─────────────── POST /api/exams/start ───────────────
exports.startExam = asyncHandler(async (req, res) => {
    const { examId } = req.body;
    const studentId = req.user.id;
    const globalSettings = await Setting.findOne() || {
        maxTabSwitches: 5,
        forceFullscreen: true,
        allowLateSubmissions: false,
        enableWebcam: true,
        disableCopyPaste: true,
        requireIDVerification: true
    };

    const fingerprint = {
        userAgent: req.headers['user-agent'],
        platform: req.headers['x-fingerprint-platform'] || 'web',
        width: req.headers['x-fingerprint-width'] || '0',
        height: req.headers['x-fingerprint-height'] || '0'
    };
    const isElectron = req.headers['x-app-mode'] === 'electron';

    const secureMeta = {
        isSecureClient: isElectron,
        verifiedAt: new Date(),
        client: isElectron ? 'electron' : 'web',
        userAgent: fingerprint.userAgent,
        platform: fingerprint.platform,
        resolution: `${fingerprint.width}x${fingerprint.height}`,
        baselineFingerprint: `${fingerprint.userAgent}|${fingerprint.platform}|${fingerprint.width}|${fingerprint.height}`
    };

    let session = await ExamSession.findOne({ exam: examId, student: studentId });
    
    if (session && (session.status === 'submitted' || session.status === 'auto_submitted')) {
        res.status(400);
        throw new Error('You have already submitted this exam.');
    }

    if (session) {
        session.resumeCount += 1;
        session.lastSavedAt = new Date();
        await session.save();

        const redisClient = getRedisClient();
        let liveAnswers = session.answers;
        let liveQuestionStates = session.questionStates;
        let liveRemainingTime = session.remainingTimeSeconds;
        let liveIndex = session.currentQuestionIndex;

        if (redisClient) {
            const cacheKey = `exam_session:${examId}:${studentId}`;
            const cachedData = await redisClient.hgetall(cacheKey);
            
            if (cachedData && Object.keys(cachedData).length > 0) {
                try {
                    liveAnswers = cachedData.answers ? JSON.parse(cachedData.answers) : liveAnswers;
                    liveQuestionStates = cachedData.questionStates ? JSON.parse(cachedData.questionStates) : liveQuestionStates;
                    liveRemainingTime = cachedData.remainingTimeSeconds ? parseInt(cachedData.remainingTimeSeconds) : liveRemainingTime;
                    liveIndex = cachedData.currentQuestionIndex ? parseInt(cachedData.currentQuestionIndex) : liveIndex;
                } catch (parseErr) {
                    console.error('⚠️ Redis Hash parsing error in startExam:', parseErr.message);
                }
            } else {
                const savedAnswers = await ExamAnswer.find({ sessionId: session._id });
                liveAnswers = {};
                savedAnswers.forEach(a => {
                    liveAnswers[a.questionId] = a.code ? { answer: a.answer, code: a.code } : a.answer;
                });
                await redisClient.hset(cacheKey, 'answers', JSON.stringify(liveAnswers), 'currentQuestionIndex', (liveIndex ?? 0).toString(), 'questionStates', JSON.stringify(liveQuestionStates), 'remainingTimeSeconds', (liveRemainingTime ?? 0).toString());
                await redisClient.expire(cacheKey, 86400);
            }
        }

        const exam = await Exam.findById(examId).populate('creator', 'name');
        if (!exam) throw new Error('Exam not found');

        const safeQuestions = exam.questions.map((q, index) => {
            const safe = { id: q._id, index, type: q.type, questionText: q.questionText, marks: q.marks };
            if (q.type === 'mcq') safe.options = q.options;
            if (q.type === 'short') safe.maxWords = q.maxWords;
            if (q.type === 'coding') { safe.language = q.language; safe.initialCode = q.initialCode; }
            return safe;
        });

        return res.json({ message: 'Exam session resumed!', sessionId: session._id, startedAt: session.startedAt, isResumed: true, resumeCount: session.resumeCount, currentQuestionIndex: liveIndex, answers: liveAnswers, questionStates: liveQuestionStates, remainingTimeSeconds: liveRemainingTime, status: session.status, exam: { ...exam._doc, questions: safeQuestions, settings: globalSettings } });
    }

    const exam = await Exam.findById(examId);
    if (!exam) throw new Error('Exam not found');

    const initialStates = {};
    exam.questions.forEach((_, idx) => { initialStates[String(idx)] = 'not_visited'; });

    const crypto = require('crypto');
    const newSession = new ExamSession({
        exam: examId,
        student: studentId,
        status: 'in_progress',
        totalMarks: exam.totalMarks,
        startedAt: new Date(),
        currentQuestionIndex: 0,
        questionStates: initialStates,
        remainingTimeSeconds: exam.duration * 60,
        answers: {},
        resumeCount: 0,
        secureMeta: {
            ...secureMeta,
            // 🛡️ Fix 2: Multi-part session binding for flexible validation
            sessionHash: `${crypto.createHash('sha256').update(`${req.headers['x-forwarded-for'] || req.socket.remoteAddress}|${req.headers['user-agent']}|${req.headers['x-device-id'] || 'no-device'}`).digest('hex')}|${req.headers['x-forwarded-for'] || req.socket.remoteAddress}|${req.headers['user-agent']}|${req.headers['x-device-id'] || 'no-device'}`
        }
    });
    try {
        await newSession.save();
        session = newSession;
    } catch (saveErr) {
        // 🛡️ Fix 36: Double-click Race Condition Handling (E11000)
        if (saveErr.code === 11000) {
            console.log(`[Race Condition] Handled concurrent startExam for student ${studentId}`);
            session = await ExamSession.findOne({ exam: examId, student: studentId });
        } else {
            throw saveErr;
        }
    }

    // ─── Update ExamInvite Status → exam_started ─────
    ExamInvite.findOneAndUpdate(
        { exam: examId, student: studentId, status: { $in: ['opened', 'sent', 'pending'] } },
        { status: 'exam_started' }
    ).catch(err => console.error('[Invite] Status update (exam_started) failed:', err.message));

    // --- Cache Initialization ---
    const redisClient = getRedisClient();
    if (redisClient) {
        const cacheKey = `exam_session:${examId}:${studentId}`;
        const durationSeconds = (exam.duration || 0) * 60;
        await redisClient.hset(
            cacheKey, 
            'answers', JSON.stringify({}), 
            'currentQuestionIndex', '0', 
            'questionStates', JSON.stringify(initialStates), 
            'remainingTimeSeconds', durationSeconds.toString()
        );
        await redisClient.expire(cacheKey, 86400);
    }

    const safeQuestions = exam.questions.map((q, index) => {
        const safe = {
            id: q._id,
            index,
            type: q.type,
            questionText: q.questionText,
            marks: q.marks,
        };
        if (q.type === 'mcq') safe.options = q.options;
        if (q.type === 'short') safe.maxWords = q.maxWords;
        if (q.type === 'coding') {
            safe.language = q.language;
            safe.initialCode = q.initialCode;
        }
        return safe;
    });

    res.json({ 
        message: 'Exam session started! Best of luck!', 
        sessionId: session._id,
        startedAt: session.startedAt,
        isResumed: false,
        remainingTimeSeconds: session.remainingTimeSeconds,
        currentQuestionIndex: 0,
        answers: {},
        questionStates: initialStates,
        exam: {
            ...exam._doc,
            questions: safeQuestions,
            settings: globalSettings
        }
    });
});


// ─────────────── POST /api/exams/save-progress ───────────────
// ⭐ CRITICAL FUNCTION — Auto-Save Progress
// Frontend calls this API every 30 seconds to ensure data persistency
exports.saveProgress = asyncHandler(async (req, res) => {
    const { examId, answers, currentQuestionIndex, questionStates, remainingTimeSeconds, lastUpdated, seq } = req.body;
    const studentId = req.user.id;

    // 1. Fetch Exam & Session to verify ownership and time
    const [exam, session] = await Promise.all([
        Exam.findById(examId),
        ExamSession.findOne({ exam: examId, student: studentId })
    ]);

    if (!exam) {
        res.status(404);
        throw new Error('Exam not found!');
    }

    if (!session) {
        res.status(404);
        throw new Error('Session not found. Please start the exam first.');
    }

    // 🛡️ Strict State Validation (Replay Attack Prevention)
    if (session.status !== 'in_progress') {
        res.status(403);
        throw new Error(`Cannot save progress. Exam is not in progress. (Status: ${session.status})`);
    }

    // 🛡️ Fix 8 & 1: Server-Side Time Authority & Auto-Submission
    const now = Date.now();
    const started = new Date(session.startedAt).getTime();
    const durationMs = exam.duration * 60 * 1000;
    const serverRemainingTime = Math.max(0, Math.floor((started + durationMs - now) / 1000));

    if (serverRemainingTime <= 0) {
        // 🛡️ Fix 8 & 1: Auto-submit logic
        if (session.status !== 'submitted' && session.status !== 'auto_submitted') {
            // 🛡️ Fix 3: Sync latest Redis data before Auto-Submission
            try {
                const redisClient = getRedisClient();
                const cached = await redisClient.hgetall(`exam_session:${examId}:${studentId}`);
                if (cached && cached.answers) {
                    const redisAnswers = JSON.parse(cached.answers);
                    // Bulk write these to Mongo if they aren't in the current payload
                    const bulkOps = Object.keys(redisAnswers).map(qId => ({
                        updateOne: {
                            filter: { sessionId: session._id, questionId: qId },
                            update: { $set: { answer: redisAnswers[qId], lastSavedAt: new Date() } },
                            upsert: true
                        }
                    }));
                    if (bulkOps.length > 0) await ExamAnswer.bulkWrite(bulkOps);
                }
            } catch (e) { console.error('Failed to sync Redis to Mongo on auto-submit:', e.message); }

            session.status = 'auto_submitted';
            session.submittedAt = new Date();
            session.remainingTimeSeconds = 0;
            await session.save();
            return res.status(403).json({ 
                success: false, 
                code: 'EXAM_EXPIRED',
                message: 'Exam time has expired. Your latest progress was successfully synced and auto-submitted.' 
            });
        }
    }

    // 🛡️ Fix 9 (Upgraded): Time Drift & Replay Protection + Monotonic Sequence
    if (lastUpdated) {
        const lastSaved = session.lastSavedAt ? new Date(session.lastSavedAt).getTime() : 0;
        if (lastUpdated < lastSaved || lastUpdated > (now + 5000)) {
            return res.status(200).json({ 
                success: true, 
                message: 'Ignored inconsistent timestamp payload (Replay or Drift detected).' 
            });
        }
    }

    // 🏎️ Fix 9 (Upgraded): Monotonic Sequence Guard
    if (seq !== undefined) {
        // Fix 1 (Edge Case): Allow reset after reconnect (seq = 1)
        if (seq <= (session.lastSeq || 0) && seq !== 1) {
            return res.status(200).json({ 
                success: true, 
                message: 'Ignored out-of-order payload (Lower sequence number).' 
            });
        }
        // Extra safety: max jump check (prevent massive sequence gaps)
        if (seq > (session.lastSeq || 0) + 200) { // Increased tolerance for reconnects
            res.status(400);
            throw new Error('Security Alert: Massive sequence jump detected.');
        }
    }

    // 🛡️ Fix 10: Answer-to-Exam ownership validation
    const validQuestionIds = new Set(exam.questions.map(q => q._id.toString()));
    
    // 🛡️ Fix 34: Explicit type-juggling protection (No Arrays allowed)
    if (Array.isArray(answers)) {
        res.status(400);
        throw new Error('Invalid answer format. Deeply nested structures (Arrays) are not permitted.');
    }

    // 🛡️ GRANULAR VALIDATION: Payload Exhaustion, Ownership & Format Guard
    if (answers && typeof answers === 'object') {
        const keys = Object.keys(answers);
        if (keys.length > 200) {
            res.status(400);
            throw new Error('Malformed payload: Excessive answer keys.');
        }

        for (const qId of keys) {
            // Fix 10: Check if question belongs to this exam
            if (!validQuestionIds.has(qId)) {
                res.status(400);
                throw new Error(`Security Alert: Question ${qId} does not belong to this exam.`);
            }

            const val = answers[qId];
            
            // Fix 34: Explicit Array and Schema check
            if (Array.isArray(val)) {
                res.status(400);
                throw new Error(`Invalid answer format for question ${qId}. Arrays are not permitted.`);
            }

            if (typeof val === 'object' && val !== null) {
                const allowedKeys = ['answer', 'code', 'language'];
                const valKeys = Object.keys(val);
                if (valKeys.some(k => !allowedKeys.includes(k))) {
                    res.status(400);
                    throw new Error(`Invalid answer object for question ${qId}. Unauthorized metadata detected.`);
                }
            }

            // Size validation
            const content = typeof val === 'object' ? (val?.code || val?.answer || '') : val;
            const len = typeof content === 'string' ? content.length : JSON.stringify(content || '').length;
            if (len > 10000) {
                res.status(400);
                throw new Error(`Payload too large: Answer for question ${qId} exceeds 10KB limit.`);
            }
        }
    }

    // 🛡️ Fix 2 (Upgraded): Atomic Status Check
    if (session.status !== SESSION_STATUS.IN_PROGRESS && session.status !== SESSION_STATUS.FLAGGED) {
        return res.status(403).json({ 
            success: false, 
            message: `Exam cannot be updated in its current state: ${session.status}` 
        });
    }

    // 🛡️ Bonus: Session Binding Check (Anti-Spoof)
    const crypto = require('crypto');
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const currentHash = crypto.createHash('sha256')
        .update(`${clientIp}|${req.headers['user-agent']}|${req.headers['x-device-id'] || 'no-device'}`)
        .digest('hex');

    if (session.secureMeta?.sessionHash) {
        const [storedHash, storedIp, storedUA, storedDeviceId] = session.secureMeta.sessionHash.split('|');
        const currentIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const currentUA = req.headers['user-agent'];
        const currentDeviceId = req.headers['x-device-id'] || 'no-device';

        // 🛡️ Fix 2 (Upgraded): Flexible Session Binding
        const isDeviceMatch = storedDeviceId === currentDeviceId;
        const isUAMatch = storedUA === currentUA;
        const isIpMatch = storedIp === currentIp;

        if (!isDeviceMatch) {
            session.status = SESSION_STATUS.FLAGGED;
            session.violations.push({
                type: VIOLATION_TYPES.SESSION_HASH_MISMATCH,
                severity: 'high',
                details: 'Critical: Device ID mismatch mid-session. Suspected session hijacking.',
                timestamp: new Date()
            });
        } else if (!isUAMatch || !isIpMatch) {
            // Soft signals: Log but don't flag as critical unless both change
            if (!isUAMatch && !isIpMatch) session.status = SESSION_STATUS.FLAGGED;
            
            session.violations.push({
                type: VIOLATION_TYPES.SESSION_HASH_MISMATCH,
                severity: 'low',
                details: `Identity drift: ${!isUAMatch ? 'Browser changed' : ''} ${!isIpMatch ? 'IP changed (Mobile/NAT)' : ''}`,
                timestamp: new Date()
            });
        }
    }

    // 🛡️ RUNTIME SECURITY: Continuous Verification (Softened for Web)
    const fingerprint = {
        userAgent: req.headers['user-agent'],
        platform: req.headers['x-fingerprint-platform'] || 'web',
        width: req.headers['x-fingerprint-width'] || '0',
        height: req.headers['x-fingerprint-height'] || '0'
    };

    // Update verification timestamp
    if (session.secureMeta) {
        session.secureMeta.verifiedAt = new Date();
    }

    // Baseline Fingerprint Check with Tolerance (+/- 50px)
    const [baseUA, basePlatform, baseWidth, baseHeight] = (session.secureMeta.baselineFingerprint || "").split('|');
    
    // Fix 2: Finite Fingerprint Validation
    const clientWidth = Number(fingerprint.width);
    const clientHeight = Number(fingerprint.height);

    if (!Number.isFinite(clientWidth) || !Number.isFinite(clientHeight) || clientWidth > 10000 || clientHeight > 10000) {
        session.status = 'flagged';
        session.violations.push({
            type: 'Invalid Data',
            severity: 'high',
            details: `Suspected payload tampering: Invalid resolution data (${fingerprint.width}x${fingerprint.height})`,
            timestamp: new Date()
        });
        await session.save();
        return res.status(400).json({ error: 'Security: Invalid client fingerprint data.' });
    }

    const widthDiff = Math.abs(parseInt(baseWidth) - clientWidth);
    const heightDiff = Math.abs(parseInt(baseHeight) - clientHeight);
    const isUAMatch = baseUA === fingerprint.userAgent;
    const isPlatformMatch = basePlatform === fingerprint.platform;

    if (!isUAMatch || !isPlatformMatch || widthDiff > 50 || heightDiff > 50) {
        // Soft Escalation: Flag instead of Block for resolution/minor setup changes
        session.status = 'flagged';
        session.violations.push({
            type: 'Environment Change',
            severity: 'medium',
            details: `Fingerprint mismatch: ${widthDiff}px width diff, ${heightDiff}px height diff`,
            timestamp: new Date()
        });
        await session.save();
        
        // We still allow progress save but with a warning in response
        return res.json({ 
            success: true, 
            warning: 'Security environment setup changed. Incident flagged.',
            status: 'flagged' 
        });
    }

    // 🏎️ Fix 9: Replay Protection already handled above with MongoDB SoT.
    // Redis update remains for optimization.
    const redisClient = getRedisClient();
    const cacheKey = `exam_session:${examId}:${studentId}`;

    // 🛡️ Fix 13: Strong Normalization Helper
    const normalizeAnswer = (val) => {
        if (typeof val !== 'string') return val;
        return val.replace(/\s+/g, ' ').trim().toLowerCase();
    };

    // 2. Relational Split: Save answers to ExamAnswer collection
    if (answers && typeof answers === 'object') {
        const bulkOps = Object.keys(answers).map(qId => {
            const answerVal = answers[qId];
            const studentAnswer = typeof answerVal === 'object' ? (answerVal.answer ?? null) : answerVal;

            return {
                updateOne: {
                    filter: { sessionId: session._id, questionId: qId },
                    update: { 
                        $set: { 
                            // Fix 12: Use null instead of undefined
                            answer: studentAnswer,
                            normalizedAnswer: normalizeAnswer(studentAnswer),
                            code: typeof answerVal === 'object' ? (answerVal.code ?? null) : null,
                            lastSavedAt: new Date()
                        }
                    },
                    upsert: true
                }
            };
        });

        if (bulkOps.length > 0) {
            await ExamAnswer.bulkWrite(bulkOps);
        }
    }

    // 3. Update Redis Cache (High performance fallback)
    // 🛡️ Fix 26: Redis is a non-blocking dependency. Success path must proceed even if Redis fails.
    if (redisClient) {
        try {
            const updates = [];
            if (answers !== undefined)              updates.push('answers', JSON.stringify(answers));
            if (currentQuestionIndex !== undefined) updates.push('currentQuestionIndex', (currentQuestionIndex ?? 0).toString());
            if (questionStates !== undefined)       updates.push('questionStates', JSON.stringify(questionStates));
            if (remainingTimeSeconds !== undefined) updates.push('remainingTimeSeconds', (remainingTimeSeconds ?? 0).toString());
            if (lastUpdated !== undefined)          updates.push('clientLastUpdated', (lastUpdated ?? Date.now()).toString());
            updates.push('lastSavedAt', new Date().toISOString());

            if (updates.length > 0) {
                await redisClient.hset(cacheKey, ...updates);
                await redisClient.expire(cacheKey, 86400);
            }
        } catch (redisErr) {
            const logger = require('../utils/logger');
            logger.warn(`📡 Redis HSET failed for ${cacheKey}, continuing with DB only: ${redisErr.message}`);
        }
    }

    // 4. Update ExamSession Metadata
    session.currentQuestionIndex = currentQuestionIndex !== undefined ? currentQuestionIndex : session.currentQuestionIndex;
    if (questionStates) session.questionStates = questionStates;
    
    // Fix 9: Update sequence number
    if (seq !== undefined) session.lastSeq = seq;

    // Fix 1: Stop overwriting remainingTimeSeconds from client
    session.remainingTimeSeconds = serverRemainingTime;
    session.lastSavedAt = new Date();
    await session.save();

    res.json({ success: true, message: 'Progress synchronized successfully.' });
});


// ─────────────── GET /api/exams/resume/:examId ───────────────
// Restores the full state for a student returning to an exam session.
exports.resumeExam = asyncHandler(async (req, res) => {
    const examId = req.params.examId;
    const studentId = req.user.id;

    const session = await ExamSession.findOne({ exam: examId, student: studentId });

    if (!session) {
        res.status(404);
        throw new Error('No session found. Please start the exam first.');
    }

    // Check if already submitted
    if (session.status === 'submitted' || session.status === 'auto_submitted') {
        return res.json({
            message: 'This exam has already been submitted.',
            status: session.status,
            score: session.score,
            totalMarks: session.totalMarks,
            percentage: session.percentage,
            passed: session.passed,
            isCompleted: true
        });
    }

    const exam = await Exam.findById(examId).populate('creator', 'name');
    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }

    const safeQuestions = exam.questions.map((q, index) => {
        const safe = {
            id: q._id,
            index,
            type: q.type,
            questionText: q.questionText,
            marks: q.marks,
        };
        if (q.type === 'mcq') safe.options = q.options;
        if (q.type === 'short') safe.maxWords = q.maxWords;
        if (q.type === 'coding') {
            safe.language = q.language;
            safe.initialCode = q.initialCode;
        }
        return safe;
    });

    session.resumeCount += 1;
    session.lastSavedAt = new Date();
    await session.save();

    const redisClient = getRedisClient();
    let liveAnswers = session.answers;
    let liveQuestionStates = session.questionStates;
    let liveRemainingTime = session.remainingTimeSeconds;
    let liveIndex = session.currentQuestionIndex;

    if (redisClient) {
        const cacheKey = `exam_session:${examId}:${studentId}`;
        
        // 🛡️ Fix 42: Performance - Pull metadata selectively if only certain fields needed
        // For resume, we still need most fields, but let's at least use try/catch effectively
        const cachedData = await redisClient.hgetall(cacheKey);
        
        if (cachedData && Object.keys(cachedData).length > 0) {
            try {
                liveAnswers = cachedData.answers ? JSON.parse(cachedData.answers) : liveAnswers;
            } catch (e) {
                console.error('[Integrity] Redis answers corruption:', e.message);
            }

            try {
                liveQuestionStates = cachedData.questionStates ? JSON.parse(cachedData.questionStates) : liveQuestionStates;
            } catch (e) {
                console.error('[Integrity] Redis states corruption:', e.message);
            }

            liveRemainingTime = cachedData.remainingTimeSeconds ? parseInt(cachedData.remainingTimeSeconds) : liveRemainingTime;
            liveIndex = cachedData.currentQuestionIndex ? parseInt(cachedData.currentQuestionIndex) : liveIndex;
        } else {
            // FALLBACK: Hydrate from ExamAnswer collection
            const savedAnswers = await ExamAnswer.find({ sessionId: session._id });
            liveAnswers = {};
            savedAnswers.forEach(a => {
                liveAnswers[a.questionId] = a.code ? { answer: a.answer, code: a.code } : a.answer;
            });

            // Backfill Redis
            await redisClient.hset(
                cacheKey, 
                'answers', JSON.stringify(liveAnswers), 
                'currentQuestionIndex', (liveIndex ?? 0).toString(), 
                'questionStates', JSON.stringify(liveQuestionStates), 
                'remainingTimeSeconds', (liveRemainingTime ?? 0).toString()
            );
            await redisClient.expire(cacheKey, 86400);
        }
    }

    res.json({
        message: 'Session restored!',
        isCompleted: false,
        sessionId: session._id,
        exam: {
            id: exam._id,
            title: exam.title,
            category: exam.category,
            duration: exam.duration,
            totalMarks: exam.totalMarks,
            startTime: exam.scheduledDate,
            creator: exam.creator?.name,
            questions: safeQuestions
        },
        answers: liveAnswers,
        currentQuestionIndex: liveIndex,
        questionStates: liveQuestionStates,
        remainingTimeSeconds: liveRemainingTime,
        status: session.status,
        lastSeq: session.lastSeq || 0 // Fix 1: Sync sequence to prevent desync
    });
});


exports.submitExam = asyncHandler(async (req, res) => {
    const { examId, answers } = req.body;
    const studentId = req.user.id;

    const exam = await Exam.findById(examId);
    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }

    const session = await ExamSession.findOne({ exam: examId, student: studentId });
    if (!session) {
        res.status(404);
        throw new Error('Active session not found');
    }

    // 🛡️ RUNTIME SECURITY: Continuous Verification (Softened for Web)
    const fingerprint = {
        userAgent: req.headers['user-agent'],
        platform: req.headers['x-fingerprint-platform'] || 'web',
        width: req.headers['x-fingerprint-width'] || '0',
        height: req.headers['x-fingerprint-height'] || '0'
    };

    // Bug Fix: Submission Lock (Guardrail 3)
    if (session.status === 'submitted' || session.status === 'auto_submitted' || session.status === 'blocked') {
        res.status(400);
        throw new Error(`This exam cannot be submitted. Status: ${session.status}`);
    }

    // ⏱️ Fix: Server-Side Timer Validation (Strict 30-sec Grace)
    const currentTime = Date.now();
    const startTime = new Date(session.startedAt).getTime();
    const durationMs = exam.duration * 60 * 1000;
    const GRACE_MS = 30000; // 30 seconds max buffer for network lag

    let isLateSubmission = false;
    if (currentTime > (startTime + durationMs + GRACE_MS)) {
        isLateSubmission = true;
        console.warn(`🚫 [Security] Late submission detected for ${studentId}. Overtime payload rejected.`);
        
        session.violations.push({
            type: 'Time Manipulation',
            severity: 'critical',
            details: 'Exam submitted after strict server deadline. Overtime answers were rejected.',
            timestamp: new Date()
        });
    }

    // 🚀 Redis Final Merge Logic
    const redisClient = getRedisClient();
    let finalAnswers = answers || {};
    if (redisClient) {
        try {
            const cacheKey = `exam_session:${examId}:${studentId}`;
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
                    console.error('⚠️ Redis Answers parse failed in submitExam:', parseErr.message);
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
    const summaryResults = []; // For response only
    let autoScore = 0;
    let hasShortAnswers = false;

    for (let index = 0; index < exam.questions.length; index++) {
        const q = exam.questions[index];
        const qId = q._id.toString();

        // 🛡️ Fix 11: Fail-fast on Invalid Marks
        if (typeof q.marks !== 'number' || q.marks < 0) {
            console.error(`[SECURITY] Invalid question marks configuration for exam ${examId}, question ${qId}`);
            res.status(500);
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
                // For UI labs, we use the score from the background worker
                // Check if an existing ExamAnswer has a frontendResult
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
                    hasShortAnswers = true; // Mark for review if not graded yet
                    evaluation = {
                        marksObtained: 0,
                        maxMarks: q.marks || 0,
                        status: 'pending_review',
                        result: { message: 'UI Verification Pending' }
                    };
                }
            }
        }

        // Prepare relational update
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
                        result: evaluation // Detailed results (test cases, AI reasoning)
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

    // Execute Relational Writes
    if (answerBulkOps.length > 0) {
        await ExamAnswer.bulkWrite(answerBulkOps);
    }

    // ─── 🛡️ Zero-Trust Behavioral Anomaly Detection ────────
    const timeTakenSeconds = Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000);
    const totalQuestions = exam.questions ? exam.questions.length : 0;
    
    // 1. Speed Anomaly: Adaptive check (is it impossibly fast?)
    let speedAnomalyFlag = false;
    if (totalQuestions > 0 && (timeTakenSeconds / totalQuestions) < 5) {
        speedAnomalyFlag = true;
    }

    // 2. Telemetry Health (Missing data = Tampering)
    const heartbeatInterval = 30; // expected every 30s
    const expectedHeartbeats = Math.max(1, Math.floor(timeTakenSeconds / heartbeatInterval));
    const actualHeartbeats = session.heartbeatCount || 0;
    const telemetryRatio = actualHeartbeats / expectedHeartbeats;
    
    let missingTelemetryScore = 0;
    if (telemetryRatio < 0.1) missingTelemetryScore = 20; // Critical missing data
    else if (telemetryRatio < 0.3) missingTelemetryScore = 10; // Highly suspicious
    
    // Check Max Gap (e.g., disconnected for 5+ mins)
    if ((session.maxHeartbeatGap || 0) > 300000) {
        missingTelemetryScore += 10;
    }

    // 3. Suspicious Perfection
    let perfectScoreAnomaly = false;
    if (percentage > 95 && speedAnomalyFlag && (session.violations.length === 0 || telemetryRatio < 0.5)) {
        perfectScoreAnomaly = true;
    }

    // 4. Central Risk Score Calculation (Overrides incremental frontend calculations)
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

    // ─── Update Session Status ──────────────
    const totalMarksVal = Number(exam.totalMarks) || 1;
    const finalStatus = hasShortAnswers ? 'pending_review' : (isLateSubmission ? 'auto_submitted' : 'submitted');

    session.score = Number(autoScore) || 0;
    session.totalMarks = Number(totalMarksVal) || 1;
    session.percentage = Number(percentage) || 0;
    session.passed = hasShortAnswers ? false : passed;
    session.status = finalStatus;
    session.requiresManualGrading = hasShortAnswers;
    session.submittedAt = new Date();
    await session.save();

    // ─── Update ExamInvite Status → completed ────────
    ExamInvite.findOneAndUpdate(
        { exam: examId, student: studentId, status: { $in: ['exam_started', 'opened'] } },
        { status: 'completed' }
    ).catch(err => console.error('[Invite] Status update (completed) failed:', err.message));

    // ⚡ CRITICAL: Clear student's dashboard cache to reflect submission immediately
    await clearCache(`active_exams_user_${studentId}`);

    // 🧠 AI Intelligence: Trigger background pre-computation
    const { addIntelligenceJob } = require('../queues/intelligenceQueue');
    await addIntelligenceJob(studentId);

    res.json({
        message: hasShortAnswers 
            ? 'Exam submitted! Some answers require mentor evaluation.'
            : 'Exam submitted successfully!',
        score: session.score,
        totalMarks: session.totalMarks,
        percentage: session.percentage,
        passed: session.passed,
        status: session.status,
        requiresManualGrading: session.requiresManualGrading,
        questionResults: summaryResults
    });
});


// ─────────────── GET /api/exams/session-detail/:sessionId ───────────────
// Full session detail for Mentor/Admin — includes questions, answers, and grading results
exports.getSessionDetail = asyncHandler(async (req, res) => {
    const session = await ExamSession.findById(req.params.sessionId)
        .populate('student', 'name email')
        .populate('exam');

    if (!session) {
        res.status(404);
        throw new Error('Session not found');
    }

    const exam = session.exam;
    if (!exam) {
        res.status(404);
        throw new Error('Associated exam not found');
    }

    // Fetch all answers for this session (Bug Fix: Relational Join)
    const savedAnswers = await ExamAnswer.find({ sessionId: session._id });

    // Build detailed question view
    const questionsWithResults = exam.questions.map((q, index) => {
        const qId = q._id.toString();
        const savedAnswer = savedAnswers.find(a => a.questionId === qId);
        const result = savedAnswer?.result || {};

        const detail = {
            questionId: qId,
            index,
            type: q.type,
            questionText: q.questionText,
            marks: q.marks,
            studentAnswer: savedAnswer?.code ? { code: savedAnswer.code, answer: savedAnswer.answer } : savedAnswer?.answer,
            marksObtained: savedAnswer?.marksObtained || 0,
            maxMarks: savedAnswer?.maxMarks || q.marks || 0,
            status: savedAnswer?.status || 'pending_review',
        };

        if (q.type === 'mcq') {
            detail.options = q.options;
            detail.correctOption = q.correctOption;
            detail.studentChoice = result.studentChoice;
            detail.correctChoice = result.correctChoice;
        }

        if (q.type === 'coding') {
            detail.language = q.language;
            detail.testCaseResults = result.testCaseResults || [];
            detail.totalTestCases = (q.testCases || []).length;
            detail.passedTestCases = (result.testCaseResults || []).filter(t => t.passed).length;
        }

        if (q.type === 'short') {
            detail.expectedAnswer = q.expectedAnswer;
            detail.maxWords = q.maxWords;
            detail.aiSuggestedMarks = result.aiSuggestedMarks;
            detail.aiConfidence = result.aiConfidence || null;
            detail.aiReasoning = result.aiReasoning;
            detail.mentorFeedback = result.mentorFeedback || '';
        }

        if (q.type === 'frontend-react') {
            detail.testCaseResults = result.testCaseResults || [];
            detail.totalTestCases = (q.frontendTestCases || []).length;
            detail.passedTestCases = (result.testCaseResults || []).filter(t => t.passed).length;
            detail.files = savedAnswer?.answer?.files || {};
        }

        return detail;
    });

    res.json({
        sessionId: session._id,
        student: {
            id: session.student?._id,
            name: session.student?.name || 'Unknown',
            email: session.student?.email || ''
        },
        exam: {
            id: exam._id,
            title: exam.title,
            category: exam.category,
            duration: exam.duration,
            totalMarks: exam.totalMarks,
            passingMarks: exam.passingMarks
        },
        score: session.score,
        totalMarks: session.totalMarks,
        percentage: session.percentage,
        passed: session.passed,
        status: session.status,
        requiresManualGrading: session.requiresManualGrading,
        violations: session.violations.length,
        tabSwitches: session.tabSwitchCount,
        startedAt: session.startedAt,
        submittedAt: session.submittedAt,
        questions: questionsWithResults
    });
});


// ─────────────── PUT /api/exams/evaluate/:sessionId ───────────────
// Mentor manually grades short answers and finalizes the session
exports.evaluateSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { grades } = req.body;
    // grades = [{ questionId, marksObtained, mentorFeedback }]

    if (!grades || !Array.isArray(grades)) {
        res.status(400);
        throw new Error('grades array is required');
    }

    const session = await ExamSession.findById(sessionId).populate('exam');
    if (!session) {
        res.status(404);
        throw new Error('Session not found');
    }

    const exam = session.exam;
    if (!exam) {
        res.status(404);
        throw new Error('Associated exam not found');
    }

    // Apply mentor grades to ExamAnswer collection
    const bulkOps = grades.map(grade => {
        // Validation: awarded marks cannot exceed max marks for this question
        // 🛡️ Fix 11: Fail-fast on Invalid Marks
        const question = exam.questions.id(grade.questionId) || exam.questions[grade.questionIndex];
        if (!question || typeof question.marks !== 'number') {
            res.status(400);
            throw new Error(`Invalid question configuration for ID: ${grade.questionId}`);
        }
        
        const maxMarks = question.marks;
        const awarded = Math.min(Math.max(Number(grade.marksObtained) || 0, 0), maxMarks);

        return {
            updateOne: {
                filter: { sessionId: session._id, questionId: grade.questionId || (question?._id.toString()) },
                update: {
                    $set: {
                        marksObtained: awarded,
                        status: 'manually_graded',
                        'result.mentorFeedback': grade.mentorFeedback || '',
                        'result.gradedBy': req.user.id,
                        'result.gradedAt': new Date()
                    }
                }
            }
        };
    });

    if (bulkOps.length > 0) {
        await ExamAnswer.bulkWrite(bulkOps);
    }

    // Recalculate total score by summing up all ExamAnswer marks for this session
    const allAnswers = await ExamAnswer.find({ sessionId: session._id });
    let totalScore = 0;
    allAnswers.forEach(a => {
        totalScore += (a.marksObtained || 0);
    });

    const totalMarks = Number(exam.totalMarks) || 1; 
    const percentage = Math.round((totalScore / totalMarks) * 100) || 0;
    const passed = percentage >= (Number(exam.passingMarks) || 40);

    session.score = totalScore;
    session.percentage = percentage;
    session.passed = passed;
    session.status = 'submitted';
    session.requiresManualGrading = false;

    await session.save();

    res.json({
        message: 'Session evaluated and finalized!',
        score: session.score,
        totalMarks: session.totalMarks,
        percentage: session.percentage,
        passed: session.passed,
        status: session.status
    });
});

// ─────────────── POST /api/exams/incident ───────────────
// Logs a proctoring violation to the session
exports.logIncident = asyncHandler(async (req, res) => {
    const { examId, type, severity, details } = req.body;
    const studentId = req.user.id;
    const now = new Date();

    const session = await ExamSession.findOne({ exam: examId, student: studentId });
    
    if (!session) {
        res.status(404);
        throw new Error('Exam session not found.');
    }

    // 🛡️ Strict State Validation (Replay Attack Prevention)
    if (session.status !== 'in_progress') {
        res.status(403);
        throw new Error('Cannot log incidents. Exam is not in progress.');
    }

    // 🛡️ Server-Side Sliding Window Debounce (Spam Prevention)
    // Ignore identical violations occurring within 2 seconds
    const lastIncident = session.violations && session.violations.length > 0 
        ? session.violations[session.violations.length - 1] 
        : null;

    if (lastIncident && lastIncident.type === type) {
        const timeDiff = now - new Date(lastIncident.timestamp);
        if (timeDiff < 2000) {
            return res.json({ 
                message: 'Incident ignored (debounced)', 
                violationCount: session.violations.length,
                tabSwitches: session.tabSwitchCount,
                status: session.status
            });
        }
    }

    // Add new violation
    session.violations.push({
        type: type || 'Unknown',
        severity: severity || 'medium',
        details: details || '',
        timestamp: now
    });

    // Cap violation list to prevent memory bloat / DoS attacks
    if (session.violations.length > 100) {
        session.violations = session.violations.slice(-100);
    }

    if (type === 'Tab Switch') {
        session.tabSwitchCount += 1;
    }

    // 🏎️ Incremental Risk Score Calculation
    const riskDeltas = {
        'Tab Switch': 2,
        'Environment Tampering': 10,
        'Security Breach': 15,
        'Invalid Data': 5
    };
    const delta = riskDeltas[type] || 3;
    
    session.riskScore = Math.min((session.riskScore || 0) + delta, 100);

    // 🛡️ Cheating Protection Enforcement
    const globalSettings = await Setting.findOne() || { maxTabSwitches: 5 };
    if (session.tabSwitchCount >= globalSettings.maxTabSwitches && session.status === 'in_progress') {
        session.status = 'blocked';
        session.blockReason = 'Excessive tab switching detected by system proctor';

        const io = req.app.get('io');
        if (io) {
            io.to(`student_${studentId}`).emit('force_block_screen', {
                reason: session.blockReason
            });
        }
    }

    await session.save();

    res.json({ 
        message: 'Incident logged', 
        violationCount: session.violations.length,
        tabSwitches: session.tabSwitchCount,
        status: session.status
    });
});


// ─────────────── GET /api/exams/submissions/:examId ───────────────
// Mentors view all submissions for a specific exam
exports.getExamSubmissions = asyncHandler(async (req, res) => {
    const sessions = await ExamSession.find({ exam: req.params.examId })
        .populate('student', 'name email')
        .sort({ submittedAt: -1 });

    const result = sessions.map(s => ({
        id: s._id,
        studentName: s.student?.name || 'Unknown',
        studentEmail: s.student?.email || '',
        score: s.score,
        totalMarks: s.totalMarks,
        percentage: s.percentage,
        passed: s.passed,
        status: s.status,
        violationCount: s.violations.length,
        tabSwitches: s.tabSwitchCount,
        startedAt: s.startedAt,
        submittedAt: s.submittedAt,
        timeTaken: s.submittedAt && s.startedAt 
            ? Math.round((new Date(s.submittedAt) - new Date(s.startedAt)) / 60000) + ' min'
            : 'N/A'
    }));

    res.json(result);
});


// ─────────────── GET /api/exams/student-result/:examId ───────────────
// Secure self-result fetch for students. Strips correct answers to preserve integrity.
exports.getStudentResult = asyncHandler(async (req, res) => {
    const examId = req.params.examId;
    const studentId = req.user.id;

    const session = await ExamSession.findOne({ exam: examId, student: studentId })
        .populate('student', 'name email')
        .populate('exam', 'title category duration totalMarks passingMarks');

    if (!session) {
        res.status(404);
        throw new Error('No exam result found for this session.');
    }

    // Security: Enforce self-access
    if (String(session.student._id) !== String(studentId)) {
        res.status(403);
        throw new Error('Unauthorized access to this result.');
    }

    // Security: Enforce Admin Toggle
    if (session.exam && session.exam.resultsPublished === false) {
        res.status(403);
        throw new Error('Results for this assignment are currently pending or hidden by the administrator.');
    }

    // Fetch relational results
    const savedAnswers = await ExamAnswer.find({ sessionId: session._id });

    // Strip answers & correct keys to prevent bank leaks
    const sanitizedQuestionResults = savedAnswers.map(ans => {
        const result = ans.result || {};
        
        // Remove Sensitive Correct Data
        delete result.correctChoice;
        if (result.testCaseResults) {
            result.testCaseResults = result.testCaseResults.map(tc => {
                const safeTC = { ...tc };
                delete safeTC.expectedOutput;
                // If hidden test case, hide input and output too
                if (tc.isHidden) {
                    safeTC.input = 'Hidden';
                    safeTC.actualOutput = 'Hidden';
                }
                return safeTC;
            });
        }

        return {
            questionId: ans.questionId,
            type: result.type,
            marksObtained: ans.marksObtained,
            maxMarks: ans.maxMarks,
            status: ans.status,
            result: result
        };
    });

    // Calculate aggregated section stats
    const sectionStats = sanitizedQuestionResults.reduce((acc, curr) => {
        const type = curr.type || 'other';
        if (!acc[type]) acc[type] = { total: 0, correct: 0, attempted: 0, marks: 0 };
        
        acc[type].total += 1;
        if (curr.status === 'correct') acc[type].correct += 1;
        if (curr.marksObtained > 0 || curr.status !== 'not_answered') {
            acc[type].attempted += 1;
        }
        acc[type].marks += curr.marksObtained || 0;
        
        return acc;
    }, {});

    res.json({
        sessionId: session._id,
        examTitle: session.exam?.title,
        score: session.score,
        totalMarks: session.totalMarks,
        percentage: session.percentage,
        passed: session.passed,
        status: session.status,
        submittedAt: session.submittedAt,
        startedAt: session.startedAt,
        violations: session.violations.length,
        tabSwitches: session.tabSwitchCount,
        sectionStats,
        results: sanitizedQuestionResults
    });
});


// ─────────────── GET /api/exams/mentor-stats ───────────────
// Dashboard statistics for the mentor - Optimized
exports.getMentorStats = asyncHandler(async (req, res) => {
    const mongoose = require('mongoose');
    const mentorId = req.user.id;
    const cacheKey = `mentor_stats_${mentorId}`;

    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const mentorIdObj = new mongoose.Types.ObjectId(mentorId);

    const mentorExams = await Exam.find({ creator: mentorIdObj }).select('_id').lean();
    const examIds = mentorExams.map(e => e._id);

    if (examIds.length === 0) {
        const emptyResult = {
            stats: { liveStudents: 0, totalSubmissions: 0, flags: 0, totalExams: 0 },
            activity: [],
            performance: [],
            summary: []
        };
        await setCache(cacheKey, emptyResult, TTL_API_CACHE);
        return res.json(emptyResult);
    }

    const stats = await ExamSession.aggregate([
        { $match: { exam: { $in: examIds } } },
        { $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            submittedCount: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
            flaggedCount: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$violations', []] } }, 0] }, 1, 0] } }
        }}
    ]);

    const performanceSessions = await ExamSession.find({ exam: { $in: examIds }, status: 'submitted' })
        .populate('student', 'name')
        .populate('exam', 'title')
        .sort({ submittedAt: -1 })
        .limit(10)
        .lean();

    const activity = performanceSessions.map(s => ({
        name: s.student?.name || 'Student',
        action: s.violations.length > 0 ? 'flagged during' : 'submitted',
        exam: s.exam?.title || 'Exam',
        time: getTimeAgo(s.submittedAt),
        type: s.violations.length > 0 ? 'flag' : 'submit'
    }));

    const result = {
        stats: {
            liveStudents: (stats[0]?.totalSessions || 0) - (stats[0]?.submittedCount || 0),
            totalSubmissions: stats[0]?.submittedCount || 0,
            flags: stats[0]?.flaggedCount || 0,
            totalExams: mentorExams.length
        },
        activity,
        performance: performanceSessions.map(s => ({
            name: s.student?.name || 'Unknown',
            exam: s.exam?.title || 'Exam',
            score: s.percentage,
            status: s.passed ? 'Passed' : 'Failed'
        })),
        summary: [] // Placeholders for future expanded stats
    };

    await setCache(cacheKey, result, TTL_API_CACHE);
    res.json(result);
});


// System-wide statistics for Administrators
exports.getAdminStats = asyncHandler(async (req, res) => {
    const cacheKey = 'admin_stats_global';
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    // 1. Heavy Aggregate: Get stats for ALL exams in one go
    const examStats = await ExamSession.aggregate([
        {
            $group: {
                _id: '$exam',
                total: { $sum: 1 },
                submitted: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
                flags: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$violations', []] } }, 0] }, 1, 0] } }
            }
        }
    ]);

    // Create a map for easy lookup
    const statsMap = {};
    let totalSessions = 0;
    let totalSubmitted = 0;
    let totalFlags = 0;

    examStats.forEach(s => {
        if (s._id) {
            statsMap[s._id.toString()] = s;
            totalSessions += s.total;
            totalSubmitted += s.submitted;
            totalFlags += s.flags;
        }
    });

    // 2. Fetch Exams with creator info
    const allExams = await Exam.find({})
        .select('title category duration totalMarks status scheduledDate questions creator')
        .populate('creator', 'name')
        .sort({ createdAt: -1 })
        .lean();

    const examList = allExams.map(exam => {
        const counts = statsMap[exam._id.toString()] || { total: 0, submitted: 0, flags: 0 };
        return {
            id: exam._id,
            name: exam.title,
            category: exam.category,
            students: counts.total,
            submitted: counts.submitted,
            flags: counts.flags,
            status: exam.status === 'published' ? 'live' : 'draft',
            creator: exam.creator?.name || 'Unknown',
            duration: exam.duration,
            questionsCount: exam.questions.length
        };
    });

    // 3. Active Sessions Snapshot
    const activeSessions = await ExamSession.find({ status: 'in_progress' })
        .populate('student', 'name email')
        .populate('exam', 'title')
        .sort({ startedAt: -1 })
        .limit(20)
        .lean();

    const result = {
        stats: {
            totalExams: allExams.length,
            totalSessions: totalSessions,
            totalSubmissions: totalSubmitted,
            flags: totalFlags,
            activeSessions: totalSessions - totalSubmitted
        },
        sessions: activeSessions.map(s => ({
            id: s._id,
            name: s.student?.name || 'Student',
            exam: s.exam?.title || 'Exam',
            risk: (s.violations?.length || 0) > 3 ? 'High' : (s.violations?.length || 0) > 0 ? 'Medium' : 'Low',
            time: s.startedAt ? `${Math.round((Date.now() - new Date(s.startedAt)) / 60000)}m` : 'N/A'
        })),
        examList,
        incidents: [] // Placeholder for detailed incident logs
    };

    await setCache(cacheKey, result, TTL_API_CACHE);
    res.json(result);
});


// ─────────────── POST /api/exams/run-code ───────────────
// Run Coding Question against Test Cases or Raw execution
exports.runCode = asyncHandler(async (req, res) => {
    const { examId, questionId, sourceCode, language, isSubmit } = req.body;

    // Bug Fix 3: Payload Size Limit (10KB)
    if (sourceCode && sourceCode.length > 10000) {
        res.status(400);
        throw new Error('Code payload too large. Maximum 10KB allowed.');
    }

    // Bug 2: Security Validation - check if student has an active session
    const session = await ExamSession.findOne({ exam: examId, student: req.user.id });
    if (req.user.role === 'student') {
        if (!session) {
            res.status(403);
            throw new Error('Unauthorized execution. Start the exam session first.');
        }

        // 🛡️ RUNTIME SECURITY: Continuous Verification (V4)
        const fingerprint = {
            userAgent: req.headers['user-agent'],
            platform: req.headers['x-fingerprint-platform'],
            width: req.headers['x-fingerprint-width'],
            height: req.headers['x-fingerprint-height']
        };
        const verification = await verifySecureRequest(
            req.headers['x-electron-key'], 
            fingerprint, 
            req.headers['x-nonce'], 
            process.env.ELECTRON_SECRET
        );

        if (!session.secureMeta?.isSecureClient || !verification.valid) {
            res.status(403);
            throw new Error(`Execution Blocked: ${verification.reason || 'Untrusted environment'}`);
        }
        if (session.status === 'submitted' || session.status === 'auto_submitted') {
            res.status(403);
            throw new Error('Unauthorized execution. Exam has already been submitted.');
        }
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }

    const question = exam.questions.id(questionId);
    if (!question || question.type !== 'coding') {
        res.status(400);
        throw new Error('Invalid coding question');
    }

    // RAW EXECUTION - Just return output (for the "Run" button)
    if (!isSubmit) {
        const sampleTc = question.testCases && question.testCases.length > 0 ? question.testCases[0] : null;
        const sampleInput = sampleTc ? sampleTc.input : '';
        // Auto-wrap: bake the first test case input as the function argument
        const wrappedCode = wrapStudentCode(sourceCode, question, language, sampleInput);
        const executionResult = await executeCode(wrappedCode, language, ''); // stdin is empty — arg is in the code

        if (!executionResult.success) {
            return res.json({ allPassed: false, error: 'Execution Error', details: executionResult.error, isRawExecution: true });
        }
        return res.json({ allPassed: true, rawOutput: executionResult.output, isRawExecution: true });
    }

    // FORMAL SUBMISSION - Run all test cases synchronously and return results immediately
    // (BullMQ async approach removed: socket broadcast was unreliable causing infinite spinner)
    const results = [];
    let allPassed = true;

    for (let i = 0; i < question.testCases.length; i++) {
        const tc = question.testCases[i];
        try {
            // Wrap per test case — bakes the specific input as a function call argument
            const wrappedCode = wrapStudentCode(sourceCode, question, language, tc.input);
            const executionResult = await executeCode(wrappedCode, language, '');

            if (executionResult.success) {
                const passed = executionResult.output.trim() === tc.expectedOutput.trim();
                if (!passed) allPassed = false;

                results.push({
                    testCaseId: i + 1,
                    passed,
                    input: tc.isHidden ? 'Hidden' : tc.input,
                    expectedOutput: tc.isHidden ? 'Hidden' : tc.expectedOutput,
                    actualOutput: tc.isHidden ? 'Hidden' : executionResult.output.trim(),
                });
            } else {
                allPassed = false;
                results.push({
                    testCaseId: i + 1,
                    passed: false,
                    input: tc.isHidden ? 'Hidden' : tc.input,
                    expectedOutput: tc.isHidden ? 'Hidden' : tc.expectedOutput,
                    actualOutput: '',
                    error: executionResult.error || 'Execution failed',
                });
                break; // Stop on compile/runtime error
            }
        } catch (execErr) {
            allPassed = false;
            results.push({ testCaseId: i + 1, passed: false, error: execErr.message });
            break;
        }
    }

    return res.json({ allPassed, results, isRawExecution: false });
});


// ─────────────── POST /api/exams/help ───────────────
// Student requests help from mentor/admin
exports.requestHelp = asyncHandler(async (req, res) => {
    const { msg } = req.body;
    if (!msg || !msg.trim()) {
        res.status(400);
        throw new Error('Message is required.');
    }

    const user = await User.findById(req.user.id).select('name email');
    const userName = user?.name || req.user.email;
    const supportMessage = {
        studentName: userName,
        studentEmail: user?.email || req.user.email,
        studentId: req.user.id,
        message: msg,
        timestamp: new Date()
    };


    const io = req.app.get('io');
    if (io) {
        // Broad alert for global monitoring
        io.to('role_mentor').to('role_admin').emit('student_need_help', supportMessage);
        
        // 🛡️ Fix Bug 5: Scoped alert for specific exam room
        const examId = req.body.examId;
        if (examId) {
            io.to(`exam_monitor_${examId}`).emit('student_need_help', supportMessage);
        }
    }

    res.status(200).json({ 
        success: true, 
        message: 'Support request sent.',
        examId: req.body.examId,
        studentId: req.user.id
    });
});

// ─────────────── POST /api/exams/import-questions/:id ───────────────
// Mentor/Admin imports questions to an existing exam
exports.importQuestions = asyncHandler(async (req, res) => {
    const examId = req.params.id;
    const { questions: newQuestions } = req.body;

    if (!Array.isArray(newQuestions)) {
        res.status(400);
        throw new Error('Questions must be an array.');
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }

    // Security: Only creator or admin
    if (exam.creator.toString() !== req.user.id && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('You do not have permission to import questions to this exam.');
    }

    try {
        // 1. Sanitization & Validation
        const sanitized = newQuestions
            .filter(q => q && q.questionText && q.type) // Basic validation
            .map(q => {
                const clean = {
                    type: q.type,
                    questionText: q.questionText.trim(),
                    marks: Number(q.marks) || 5
                };
                
                if (q.type === 'mcq') {
                    clean.options = Array.isArray(q.options) ? q.options.map(o => o.trim()) : [];
                    clean.correctOption = q.correctOption;
                } else if (q.type === 'short') {
                    clean.expectedAnswer = q.expectedAnswer?.trim();
                    clean.maxWords = Number(q.maxWords) || 150;
                } else if (q.type === 'coding') {
                    clean.language = q.language || 'javascript';
                    clean.initialCode = q.initialCode;
                    clean.testCases = Array.isArray(q.testCases) ? q.testCases : [];
                }
                
                return clean;
            });

        // 2. Duplicate Check (based on questionText)
        const existingQuestionTexts = new Set(exam.questions.map(q => q.questionText.trim()));
        const filtered = sanitized.filter(q => !existingQuestionTexts.has(q.questionText));

        if (filtered.length === 0) {
            return res.status(200).json({
                message: "No new unique questions found.",
                added: 0,
                total: exam.questions.length
            });
        }

        // 3. Append and Save
        exam.questions.push(...filtered);
        
        // Recalculate total marks
        exam.totalMarks = exam.questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
        
        await exam.save();

        res.status(200).json({
            message: "Questions imported successfully!",
            added: filtered.length,
            total: exam.questions.length,
            newTotalMarks: exam.totalMarks
        });
    } catch (err) {
        console.error("Import failed:", err);
        res.status(500);
        throw new Error("Failed to process imported questions.");
    }
});

// ═══════════════════════════════════════════════════════════
//  🚀 Multi-Platform Question Import (LeetCode / CodeChef)
// ═══════════════════════════════════════════════════════════

// The Parser Registry — easy to extend with new platforms
const parsers = {
    leetcode: parseLeetCode,
    codechef: parseCodeChef,
};

/**
 * Detects the platform based on the URL domain.
 */
const detectPlatform = (url) => {
    if (url.includes('leetcode.com')) return 'leetcode';
    if (url.includes('codechef.com')) return 'codechef';
    return null; 
};

/**
 * 🔗 Main Controller for Link-based Import
 * Includes Redis caching (24h) and Parser Registry.
 */
exports.importQuestionFromLink = asyncHandler(async (req, res) => {
    const { url } = req.body;

    // 1. Strict Validation
    if (!url || typeof url !== 'string') {
        res.status(400);
        throw new Error("A valid URL is required.");
    }

    const platform = detectPlatform(url);
    if (!platform || !parsers[platform]) {
        res.status(400);
        throw new Error("Unsupported platform. Currently supporting LeetCode & CodeChef.");
    }

    // 2. Redis Caching Layer (Check if already parsed recently)
    const redisClient = getRedisClient();
    const cacheKey = `vision:import:${platform}:${url}`;
    
    if (redisClient) {
        try {
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                return res.status(200).json({ 
                    question: JSON.parse(cached), 
                    cached: true,
                    info: "Resolved from Vision Engine Cache"
                });
            }
        } catch (cacheErr) {
            console.warn("⚠️ Redis cache read failure:", cacheErr.message);
        }
    }

    // 3. Execute Registry Parser
    try {
        const questionData = await parsers[platform](url);

        // 4. Save to Cache (Expires in 24 hours)
        if (redisClient) {
            try {
                await redisClient.set(cacheKey, JSON.stringify(questionData), {
                    EX: 86400 // 24 hours
                });
            } catch (cacheErr) {
                console.warn("⚠️ Redis cache write failure:", cacheErr.message);
            }
        }

        res.status(200).json({ 
            question: questionData, 
            cached: false 
        });

    } catch (scrapingError) {
        console.error(`[${platform.toUpperCase()}] Scraping Error:`, scrapingError.message);
        res.status(422);
        throw new Error(`Failed to extract problem details. The platform might be blocking requests or the URL is invalid.`);
    }
});

// ─────────────── POST /api/exams/run-frontend ───────────────
// Evaluates a React/UI lab submission using BullMQ background worker
exports.runFrontendCode = asyncHandler(async (req, res) => {
    const { examId, questionId, files } = req.body;
    const studentId = req.user.id; // 🛡️ Standardized: Using database ID

    if (!examId || !questionId || !files) {
        res.status(400);
        throw new Error("Missing parameters for UI evaluation.");
    }

    // 🛡️ Data Contract: Fetch test cases in Controller to ensure Worker is "thin"
    const exam = await Exam.findById(examId);
    if (!exam) {
        res.status(404);
        throw new Error("Exam not found.");
    }

    const question = exam.questions.id(questionId);
    if (!question || question.type !== 'frontend-react') {
        res.status(400);
        throw new Error("Invalid frontend-react question ID.");
    }

    // 🛡️ Fix 33: Filename Path Traversal Sanitization
    const sanitizedFiles = {};
    for (const [filename, content] of Object.entries(files)) {
        const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '');
        sanitizedFiles[safeName] = content;
    }

    const requestId = `REQ-${Date.now()}-${studentId.slice(-4)}`;
    console.log(`🚀 [Grading][${requestId}] Job created for student: ${studentId} | Q: ${questionId} | Exam: ${examId}`);

    // Add to Background Queue with versioned contract
    const job = await addFrontendEvaluationJob({
        version: 1, // Future-proofing
        requestId,
        examId,
        questionId,
        studentId,
        codeFiles: sanitizedFiles, // Renamed 'files' to 'codeFiles' per contract
        testCases: question.testCases || []
    });

    res.status(200).json({
        status: 'queued',
        jobId: job.id,
        message: "Your UI submission is being evaluated. Results will be broadcasted via socket."
    });
});
// 🆕 Terminate Session — Mentor/Admin forcibly ends an exam
exports.terminateSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const session = await ExamSession.findById(sessionId);
    if (!session) {
        res.status(404);
        throw new Error('Session not found');
    }

    if (session.status === 'submitted' || session.status === 'auto_submitted') {
        res.status(400);
        throw new Error('This exam is already completed.');
    }

    // Force terminate
    session.status = 'auto_submitted'; // Or a new status like 'terminated'
    session.submittedAt = new Date();
    session.blockReason = 'Terminated by administrator';
    await session.save();

    // Clean up Redis if exists
    const redisClient = getRedisClient();
    if (redisClient) {
        const cacheKey = `exam_session:${session.exam}:${session.student}`;
        await redisClient.del(cacheKey).catch(() => {});
    }

    console.log(`🚫 Admin Terminated session: ${sessionId} for student ${session.student}`);

    res.json({ success: true, message: 'Session terminated successfully.' });
});

// 💓 Heartbeat — Re-verifies secure client status periodically
exports.heartbeat = asyncHandler(async (req, res) => {
    const { examId } = req.body;
    const studentId = req.user.id;

    // 1. Fetch Session
    const session = await ExamSession.findOne({ exam: examId, student: studentId });
    if (!session) {
        res.status(404);
        throw new Error('Active session not found');
    }

    // 🛡️ Strict State Validation (Replay Attack Prevention)
    if (session.status !== 'in_progress') {
        res.status(403);
        throw new Error('Heartbeat ignored. Exam is not in progress.');
    }

    const now = new Date();

    // ─── Zero-Trust Telemetry Tracking ───────────
    if (session.lastHeartbeat) {
        const gapMs = now - new Date(session.lastHeartbeat);
        if (gapMs > (session.maxHeartbeatGap || 0)) {
            session.maxHeartbeatGap = gapMs;
        }
    }
    session.lastHeartbeat = now;
    session.heartbeatCount = (session.heartbeatCount || 0) + 1;

    // 2. Update Verification Timestamp
    const fingerprint = {
        userAgent: req.headers['user-agent'],
        platform: req.headers['x-fingerprint-platform'] || 'web',
        width: req.headers['x-fingerprint-width'] || '0',
        height: req.headers['x-fingerprint-height'] || '0'
    };

    if (session.secureMeta) {
        session.secureMeta.verifiedAt = now;
    }

    // Fix 8: Time validation in heartbeat
    const exam = await Exam.findById(examId);
    if (exam && session.startedAt) {
        const started = new Date(session.startedAt).getTime();
        const durationMs = exam.duration * 60 * 1000;
        const serverRemainingTime = Math.max(0, Math.floor((started + durationMs - now.getTime()) / 1000));
        
        if (serverRemainingTime <= 0) {
            session.status = 'auto_submitted';
            session.submittedAt = now;
            await session.save();
            return res.json({ success: false, code: 'EXAM_EXPIRED', status: 'auto_submitted' });
        }
        session.remainingTimeSeconds = serverRemainingTime;
    }
    await session.save();

    // Baseline Check in Heartbeat with Tolerance
    const [baseUA, basePlatform, baseWidth, baseHeight] = (session.secureMeta.baselineFingerprint || "").split('|');
    
    // Fix 2: Finite Fingerprint Validation in Heartbeat
    const clientWidth = Number(fingerprint.width);
    const clientHeight = Number(fingerprint.height);

    if (!Number.isFinite(clientWidth) || !Number.isFinite(clientHeight)) {
        return res.status(400).json({ error: 'Security: Invalid heartbeat data.' });
    }

    const widthDiff = Math.abs(parseInt(baseWidth) - clientWidth);
    const heightDiff = Math.abs(parseInt(baseHeight) - clientHeight);

    if (baseUA && (baseUA !== fingerprint.userAgent || basePlatform !== fingerprint.platform || widthDiff > 50 || heightDiff > 50)) {
         session.status = 'flagged';
         session.violations.push({
            type: 'Environment Tampering',
            severity: 'high',
            details: `Fingerprint deviation detected during heartbeat: ${widthDiff}px / ${heightDiff}px`,
            timestamp: new Date()
         });
         await session.save();
    }

    // 3. Update Session Vitality
    session.secureMeta.verifiedAt = new Date();
    session.lastSavedAt = new Date();
    await session.save();

    res.json({ 
        success: true, 
        status: session.status,
        serverTime: new Date()
    });
});

// 🔍 Live Monitoring Data — Admin view of all active sessions with Risk Scores
exports.getLiveMonitoringData = asyncHandler(async (req, res) => {
    const { id: examId } = req.params;

    const sessions = await ExamSession.find({ exam: examId })
        .populate('student', 'name email profileImage')
        .select('student status startedAt lastSavedAt violations secureMeta remainingTimeSeconds');

    const liveData = sessions.map(session => {
        // 🏎️ Fix 40: High-Performance Monitoring (Zero compute at Read-time)
        return {
            id: session._id,
            student: {
                id: session.student?._id,
                name: session.student?.name || 'Unknown',
                email: session.student?.email,
                image: session.student?.profileImage
            },
            status: session.status,
            riskScore: session.riskScore || 0,
            isOnline: (Date.now() - new Date(session.lastSavedAt || 0)) < 45000, // Active in last 45s
            violationsCount: session.violations.length,
            startedAt: session.startedAt,
            remainingTime: session.remainingTimeSeconds,
            secureClient: session.secureMeta?.isSecureClient || false,
            resolution: session.secureMeta?.resolution
        };
    });

    res.json({
        success: true,
        count: liveData.length,
        data: liveData
    });
});
