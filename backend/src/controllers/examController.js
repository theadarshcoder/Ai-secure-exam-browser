const Exam = require('../models/Exam');
const ExamSession = require('../models/ExamSession');
const ExamAnswer = require('../models/ExamAnswer');
const ExamInvite = require('../models/ExamInvite');
const User = require('../models/User');
const { getRedisClient } = require('../config/redis');
const { executeCode } = require('../services/judge0');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { getTimeAgo, parseLeetCode, parseCodeChef } = require('../utils/helpers');
const { gradeMCQ, gradeCoding, gradeShortAnswer } = require('../services/gradingService');
const { addCodeEvaluationJob } = require('../queues/codeGradingQueue');
const { addFrontendEvaluationJob } = require('../queues/frontendGradingQueue');
const { getCache, setCache, clearCache, clearPattern, TTL_API_CACHE } = require('../services/cacheService');
const Setting = require('../models/Setting');
const { verifySecureRequest } = require('../utils/securityUtils');

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

    const exam = new Exam({
        title,
        category: category || 'General',
        duration,
        totalMarks: totalMarks || (validQuestions ? validQuestions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0) : 0),
        passingMarks: passingMarks || 40,
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
    const { title, category, duration, totalMarks, passingMarks, questions, scheduledDate, status, negativeMarks } = req.body;

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
    const submittedSessions = await ExamSession.find({ 
        student: studentId, 
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
        resultsPublished: exam.resultsPublished || false,
        settings: globalSettings
    }));

    // Set Cache for 60s
    await setCache(cacheKey, result, TTL_API_CACHE);

    res.json(result);
});

// ─────────────── GET /api/exams/mentor-list ───────────────
// Mentors see exams THEY created + submission stats
// Optimized with Aggregation Pipeline to avoid N+1 query pattern
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
                from: 'examsessions',   // MongoDB collection name is lowercase plural
                localField: '_id',
                foreignField: 'exam',
                as: 'sessions'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'creator',
                foreignField: '_id',
                as: 'creatorInfo'
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
                creatorName: { $first: '$creatorInfo.name' },
                resultsPublished: '$resultsPublished'
            }
        }
    ]);

    // Populate creator details manually if needed, or stick to a simple lookup
    // Since aggregate doesn't run Mongoose middleware, we can add a $lookup for creator


    res.json(stats);
});

// ─────────────── GET /api/exams/:id ───────────────
// Load exam for student (STRIPS correct answers for security)
exports.getExamById = asyncHandler(async (req, res) => {
    const exam = await Exam.findById(req.params.id)
        .select('-questions.correctOption -questions.expectedAnswer -questions.testCases.expectedOutput') // Exclude sensitive fields directly from DB fetch
        .populate('creator', 'name'); // Creator ka naam populate karo

    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }

    // Strip correct answers so student can't cheat via network tab
    const sanitizedQuestions = exam.questions.map((q, index) => {
        const questionObject = q.toObject(); // Mongoose document ko plain object mein convert karo
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
            // Sirf input bhejo aur isHidden property ko respect karo
            safe.testCases = (questionObject.testCases || []).map(tc => ({
                input: tc.isHidden ? 'Hidden Test Case' : tc.input,
                isHidden: tc.isHidden
            }));
        }
        return safe;
    });

    // Fetch global settings to enforce proctoring rules dynamically
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

    // Must be creator or admin
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

    // Extra check: prevent publishing an empty draft
    if (status === 'published' && (!exam.questions || exam.questions.length === 0)) {
        res.status(400);
        throw new Error('Cannot publish an exam with no questions.');
    }

    exam.status = status;
    await exam.save();

    res.json({ message: `Exam status updated to ${status}`, examId, status });
});

// ─────────────── POST /api/exams/start ───────────────
// Student starts the exam — an exam session is created
// If a session already exists (e.g., disconnection), resume the session
exports.startExam = asyncHandler(async (req, res) => {
    const { examId } = req.body;
    const studentId = req.user.id;

    // Fetch global settings to enforce proctoring rules dynamically
    const globalSettings = await Setting.findOne() || {
        maxTabSwitches: 5,
        forceFullscreen: true,
        allowLateSubmissions: false,
        enableWebcam: true,
        disableCopyPaste: true,
        requireIDVerification: true
    };

    // ─── 🛡️ ENTERPRISE SECURE CLIENT VERIFICATION (V4) ───
    const fingerprint = {
        userAgent: req.headers['user-agent'],
        platform: req.headers['x-fingerprint-platform'],
        width: req.headers['x-fingerprint-width'],
        height: req.headers['x-fingerprint-height']
    };
    const electronKey = req.headers['x-electron-key'];
    const nonce = req.headers['x-nonce'];
    const timestamp = req.headers['x-timestamp'];
    const isElectron = req.headers['x-app-mode'] === 'electron';

    const verification = await verifySecureRequest(electronKey, fingerprint, nonce, timestamp, process.env.ELECTRON_SECRET);

    if (isElectron && !verification.valid) {
        res.status(403);
        throw new Error(`Secure Client Verification Failed: ${verification.reason}`);
    }

    if (!isElectron) {
        res.status(403);
        throw new Error('This exam requires the Vision Secure Browser.');
    }

    const secureMeta = {
        isSecureClient: true,
        verifiedAt: new Date(),
        client: 'electron',
        userAgent: fingerprint.userAgent,
        platform: fingerprint.platform,
        resolution: `${fingerprint.width}x${fingerprint.height}`,
        baselineFingerprint: `${fingerprint.userAgent}|${fingerprint.platform}|${fingerprint.width}|${fingerprint.height}`
    };

    // Step 1: Check if a session already exists
    let session = await ExamSession.findOne({ exam: examId, student: studentId });
    
    // Block re-attempts if already submitted
    if (session && (session.status === 'submitted' || session.status === 'auto_submitted')) {
        res.status(400);
        throw new Error('You have already submitted this exam.');
    }

    // Handle re-entry (resume case — e.g., internet restored)
    if (session) {
        session.resumeCount += 1;
        session.lastSavedAt = new Date();
        await session.save();

        // Fetch from Redis if exists, else hydrate
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
                // FALLBACK: Hydrate from ExamAnswer collection
                const savedAnswers = await ExamAnswer.find({ sessionId: session._id });
                liveAnswers = {};
                savedAnswers.forEach(a => {
                    liveAnswers[a.questionId] = a.code ? { answer: a.answer, code: a.code } : a.answer;
                });

                // Backfill Redis
                await redisClient.hset(cacheKey, 'answers', JSON.stringify(liveAnswers), 'currentQuestionIndex', liveIndex.toString(), 'questionStates', JSON.stringify(liveQuestionStates), 'remainingTimeSeconds', liveRemainingTime.toString());
                await redisClient.expire(cacheKey, 86400);
            }
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

        return res.json({ 
            message: 'Exam session resumed! Your previous progress is safe.',
            sessionId: session._id,
            startedAt: session.startedAt,
            isResumed: true,                              
            resumeCount: session.resumeCount,
            currentQuestionIndex: liveIndex,
            answers: liveAnswers,                      
            questionStates: liveQuestionStates,        
            remainingTimeSeconds: liveRemainingTime,
            status: session.status,
            exam: {
                ...exam._doc,
                questions: safeQuestions,
                settings: globalSettings
            }
        });
    }

    // Step 2: Create a new session (first attempt)
    const exam = await Exam.findById(examId);
    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }

    // Initialize question states — all "not_visited"
    const initialStates = {};
    exam.questions.forEach((_, idx) => {
        initialStates[String(idx)] = 'not_visited';
    });

    session = new ExamSession({
        exam: examId,
        student: studentId,
        totalMarks: exam.totalMarks,
        startedAt: new Date(),
        currentQuestionIndex: 0,
        questionStates: initialStates,
        remainingTimeSeconds: exam.duration * 60,   // Convert minutes to seconds
        answers: {},
        resumeCount: 0,
        secureMeta: secureMeta
    });
    await session.save();

    // ─── Update ExamInvite Status → exam_started ─────
    ExamInvite.findOneAndUpdate(
        { exam: examId, student: studentId, status: { $in: ['opened', 'sent', 'pending'] } },
        { status: 'exam_started' }
    ).catch(err => console.error('[Invite] Status update (exam_started) failed:', err.message));

    // --- Cache Initialization ---
    const redisClient = getRedisClient();
    if (redisClient) {
        const cacheKey = `exam_session:${examId}:${studentId}`;
        await redisClient.hset(cacheKey, 'answers', JSON.stringify({}), 'currentQuestionIndex', '0', 'questionStates', JSON.stringify(initialStates), 'remainingTimeSeconds', (exam.duration * 60).toString());
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
    const { examId, answers, currentQuestionIndex, questionStates, remainingTimeSeconds, lastUpdated } = req.body;
    const studentId = req.user.id;

    if (!examId) {
        res.status(400);
        throw new Error('examId is required!');
    }

    // 🛡️ GRANULAR VALIDATION: Payload Exhaustion & Format Guard
    if (answers && typeof answers === 'object') {
        const keys = Object.keys(answers);
        if (keys.length > 200) {
            res.status(400);
            throw new Error('Malformed payload: Excessive answer keys.');
        }
        for (const qId of keys) {
            const answerVal = answers[qId];
            
            // Format Validation: Check if answer is too large or invalid type
            const answerContent = typeof answerVal === 'object' ? (answerVal?.code || answerVal?.answer || '') : answerVal;
            const contentLength = typeof answerContent === 'string' ? answerContent.length : JSON.stringify(answerContent || '').length;
            
            if (contentLength > 10000) {
                res.status(400);
                throw new Error(`Payload too large: Answer for question ${qId} exceeds 10KB limit.`);
            }

            // Type Validation
            if (answerVal !== null && typeof answerVal !== 'string' && typeof answerVal !== 'number' && typeof answerVal !== 'object') {
                res.status(400);
                throw new Error(`Invalid answer format for question ${qId}`);
            }
        }
    }

    // 1. Find the session to get sessionId
    const session = await ExamSession.findOne({ exam: examId, student: studentId });
    if (!session) {
        res.status(404);
        throw new Error('Session not found. Please start the exam first.');
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
        req.headers['x-timestamp'],
        process.env.ELECTRON_SECRET
    );

    // 🛡️ LIVENESS BINDING: Check if heartbeat was received in last 90 seconds
    const lastHeartbeat = session.secureMeta?.verifiedAt;
    const isAlive = lastHeartbeat && (Date.now() - new Date(lastHeartbeat).getTime() < 90000);

    if (!session.secureMeta?.isSecureClient || !verification.valid || !isAlive) {
        const reason = !isAlive ? 'Secure session expired (Heartbeat lost)' : verification.reason;
        res.status(403);
        throw new Error(`Security Violation: ${reason || 'Untrusted environment'}`);
    }

    // Baseline Fingerprint Check with Tolerance (+/- 50px)
    const [baseUA, basePlatform, baseWidth, baseHeight] = (session.secureMeta.baselineFingerprint || "").split('|');
    const widthDiff = Math.abs(parseInt(baseWidth) - parseInt(fingerprint.width));
    const heightDiff = Math.abs(parseInt(baseHeight) - parseInt(fingerprint.height));
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

    // 🏎️ Fix 5: Auto-Save Race Condition
    // Check if we have a newer client payload already processed using Redis
    const redisClient = getRedisClient();
    const cacheKey = `exam_session:${examId}:${studentId}`;
    
    if (redisClient && lastUpdated) {
        const cachedData = await redisClient.hgetall(cacheKey);
        if (cachedData && cachedData.clientLastUpdated) {
            const previousUpdate = parseInt(cachedData.clientLastUpdated);
            if (lastUpdated < previousUpdate) {
                return res.status(200).json({ 
                    success: true, 
                    message: 'Ignored older payload to prevent race condition.' 
                });
            }
        }
    }

    // 2. Relational Split: Save answers to ExamAnswer collection
    if (answers && typeof answers === 'object') {
        const bulkOps = Object.keys(answers).map(qId => {
            const answerVal = answers[qId];
            return {
                updateOne: {
                    filter: { sessionId: session._id, questionId: qId },
                    update: { 
                        $set: { 
                            answer: typeof answerVal === 'object' ? (answerVal.answer || null) : answerVal,
                            code: typeof answerVal === 'object' ? (answerVal.code || null) : undefined,
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

    // 3. Update Redis Cache (High performance - keeps the combined object for fast hydration)
    if (redisClient) {
        const updates = [];
        if (answers !== undefined)              updates.push('answers', JSON.stringify(answers));
        if (currentQuestionIndex !== undefined) updates.push('currentQuestionIndex', currentQuestionIndex.toString());
        if (questionStates !== undefined)       updates.push('questionStates', JSON.stringify(questionStates));
        if (remainingTimeSeconds !== undefined) updates.push('remainingTimeSeconds', remainingTimeSeconds.toString());
        if (lastUpdated !== undefined)          updates.push('clientLastUpdated', lastUpdated.toString());
        updates.push('lastSavedAt', new Date().toISOString());

        if (updates.length > 0) {
            await redisClient.hset(cacheKey, ...updates);
            await redisClient.expire(cacheKey, 86400);
        }
    }

    // 4. Update ExamSession Metadata
    session.currentQuestionIndex = currentQuestionIndex !== undefined ? currentQuestionIndex : session.currentQuestionIndex;
    if (questionStates) session.questionStates = questionStates;
    if (remainingTimeSeconds !== undefined) session.remainingTimeSeconds = remainingTimeSeconds;
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
        const cachedData = await redisClient.hgetall(cacheKey);
        
        if (cachedData && Object.keys(cachedData).length > 0) {
            try {
                liveAnswers = cachedData.answers ? JSON.parse(cachedData.answers) : liveAnswers;
                liveQuestionStates = cachedData.questionStates ? JSON.parse(cachedData.questionStates) : liveQuestionStates;
                liveRemainingTime = cachedData.remainingTimeSeconds ? parseInt(cachedData.remainingTimeSeconds) : liveRemainingTime;
                liveIndex = cachedData.currentQuestionIndex ? parseInt(cachedData.currentQuestionIndex) : liveIndex;
            } catch (pErr) {
                console.error('⚠️ Redis Hash parsing error in resumeExam:', pErr.message);
            }
        } else {
            // FALLBACK: Hydrate from ExamAnswer collection
            const savedAnswers = await ExamAnswer.find({ sessionId: session._id });
            liveAnswers = {};
            savedAnswers.forEach(a => {
                liveAnswers[a.questionId] = a.code ? { answer: a.answer, code: a.code } : a.answer;
            });

            await redisClient.hset(cacheKey, 'answers', JSON.stringify(liveAnswers), 'currentQuestionIndex', liveIndex.toString(), 'questionStates', JSON.stringify(liveQuestionStates), 'remainingTimeSeconds', liveRemainingTime.toString());
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
        status: session.status
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
        throw new Error(`Submission Blocked: ${verification.reason || 'Untrusted environment'}`);
    }

    // Bug Fix: Submission Lock (Guardrail 3)
    if (session.status === 'submitted' || session.status === 'auto_submitted' || session.status === 'blocked') {
        res.status(400);
        throw new Error(`This exam cannot be submitted. Status: ${session.status}`);
    }

    // ⏱️ Fix: Timer Validation (Compare startTime + duration)
    const currentTime = Date.now();
    const startTime = new Date(session.startedAt).getTime();
    const durationMs = exam.duration * 60 * 1000;
    const bufferMs = 60000; // 60 seconds buffer for network lag

    if (currentTime > (startTime + durationMs + bufferMs)) {
        res.status(400);
        throw new Error('Exam time has expired. Submission rejected.');
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
                    if (redisAnswers && typeof redisAnswers === 'object') {
                        finalAnswers = { ...redisAnswers, ...finalAnswers };
                    }
                } catch (parseErr) {
                    console.error('⚠️ Redis Answers parse failed in submitExam:', parseErr.message);
                }
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

    // ─── Calculate Score & Update Session ──────────────
    const totalMarks = Number(exam.totalMarks) || 1;
    const finalStatus = hasShortAnswers ? 'pending_review' : 'submitted';
    const percentage = Math.round((autoScore / totalMarks) * 100) || 0;
    const passed = percentage >= (Number(exam.passingMarks) || 40);

    session.score = Number(autoScore) || 0;
    session.totalMarks = Number(totalMarks) || 1;
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
        const question = exam.questions.id(grade.questionId) || exam.questions[grade.questionIndex];
        const maxMarks = question?.marks || 0;
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

    const update = {
        $push: { 
            violations: {
                $each: [{
                    type: type || 'Unknown',
                    severity: severity || 'medium',
                    details: details || '',
                    timestamp: new Date()
                }],
                $slice: -100 // Bug 8: Cap violation list to prevent DoS attacks
            }
        }
    };

    if (type === 'Tab Switch') {
        update.$inc = { tabSwitchCount: 1 };
    }

    const session = await ExamSession.findOneAndUpdate(
        { exam: examId, student: studentId },
        update,
        { upsert: true, new: true }
    );

    // 🛡️ Fix 2: Cheating Protection Enforcement
    const globalSettings = await Setting.findOne() || { maxTabSwitches: 5 };
    if (session.tabSwitchCount >= globalSettings.maxTabSwitches && session.status === 'in_progress') {
        session.status = 'blocked';
        session.blockReason = 'Excessive tab switching detected by system proctor';
        await session.save();

        const io = req.app.get('io');
        if (io) {
            io.to(`student_${studentId}`).emit('force_block_screen', {
                reason: session.blockReason
            });
        }
    }

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

    // RAW EXECUTION - Just return output
    if (!isSubmit) {
        // We can pass a sample input if one exists, else empty
        const sampleInput = question.testCases && question.testCases.length > 0 ? question.testCases[0].input : "";
        const executionResult = await executeCode(sourceCode, language, sampleInput);

        if (!executionResult.success) {
            return res.json({ allPassed: false, error: 'Execution Error', details: executionResult.error, isRawExecution: true });
        }
        return res.json({ allPassed: true, rawOutput: executionResult.output, isRawExecution: true });
    }

    // FORMAL SUBMISSION - Evaluate against all test cases via Background Queue (with Sync Fallback)
    try {
        const { getRedisClient } = require('../config/redis');
        const redisClient = getRedisClient();
        if (!redisClient) {
            throw new Error('Redis not connected. Forcing local sync execution.');
        }

        await addCodeEvaluationJob({
            sourceCode,
            language,
            testCases: question.testCases,
            studentId: req.user.id,
            questionId
        });

        return res.json({ 
            status: 'queued', 
            message: 'Code evaluation initiated in the background. Results will be broadcast via Socket.IO.' 
        });
    } catch (qErr) {
        console.warn('⚠️ [QUEUE FALLBACK] BullMQ failed, falling back to synchronous execution:', qErr.message);
        
        // --- SYNC FALLBACK LOGIC ---
        const results = [];
        let allPassed = true;

        for (let i = 0; i < question.testCases.length; i++) {
            const tc = question.testCases[i];
            const executionResult = await executeCode(sourceCode, language, tc.input);

            if (executionResult.success) {
                const passed = executionResult.output.trim() === tc.expectedOutput.trim();
                if (!passed) allPassed = false;

                results.push({
                    testCaseId: i + 1,
                    passed,
                    input: tc.isHidden ? 'Hidden' : tc.input,
                    expectedOutput: tc.isHidden ? 'Hidden' : tc.expectedOutput,
                    actualOutput: tc.isHidden ? 'Hidden' : executionResult.output,
                });
            } else {
                allPassed = false;
                results.push({ testCaseId: i + 1, passed: false, error: executionResult.error });
                break; 
            }
        }
        return res.json({ allPassed, results, isRawExecution: false, fallback: true });
    }
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
    const studentId = req.user.email;

    if (!examId || !questionId || !files) {
        res.status(400);
        throw new Error("Missing parameters for UI evaluation.");
    }

    // Add to Background Queue
    const job = await addFrontendEvaluationJob({
        examId,
        questionId,
        studentId,
        files
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

    // 2. Verify Secure Client Headers (V4 Hardened)
    const fingerprint = {
        userAgent: req.headers['user-agent'],
        platform: req.headers['x-fingerprint-platform'],
        width: req.headers['x-fingerprint-width'],
        height: req.headers['x-fingerprint-height']
    };
    const electronKey = req.headers['x-electron-key'];
    const nonce = req.headers['x-nonce'];
    const timestamp = req.headers['x-timestamp'];
    const isElectron = req.headers['x-app-mode'] === 'electron';

    const verification = await verifySecureRequest(electronKey, fingerprint, nonce, timestamp, process.env.ELECTRON_SECRET);

    if (!isElectron || !verification.valid) {
        // 🚨 CRITICAL SEVERITY: Immediate Block
        session.violations.push({
            type: 'Security Breach',
            severity: 'critical',
            details: `Heartbeat failed: ${verification.reason || 'Non-secure client'}`,
            timestamp: new Date()
        });
        session.status = 'blocked'; // Immediate block
        session.blockReason = `Critical Security Violation: ${verification.reason || 'Environment Tampering'}`;
        await session.save();

        res.status(403);
        throw new Error(`Heartbeat Verification Failed: ${verification.reason}`);
    }

    // Baseline Check in Heartbeat with Tolerance
    const [baseUA, basePlatform, baseWidth, baseHeight] = (session.secureMeta.baselineFingerprint || "").split('|');
    const widthDiff = Math.abs(parseInt(baseWidth) - parseInt(fingerprint.width));
    const heightDiff = Math.abs(parseInt(baseHeight) - parseInt(fingerprint.height));

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
        // 🧠 RISK SCORE ENGINE (V1)
        // risk = tabSwitch * 2 + violations * 3 + heartbeat_miss * 5 + fingerprint_change * 10
        const tabSwitches = session.violations.filter(v => v.type === 'Tab Switched').length;
        const securityBreaches = session.violations.filter(v => v.type === 'Security Breach').length;
        const environmentChanges = session.violations.filter(v => v.type === 'Environment Change' || v.type === 'Environment Tampering').length;
        
        const heartbeatMissed = (Date.now() - new Date(session.secureMeta?.verifiedAt || 0)) > 60000 ? 1 : 0;

        let riskScore = (tabSwitches * 2) + (session.violations.length * 3) + (heartbeatMissed * 5) + (environmentChanges * 10) + (securityBreaches * 15);
        
        // Cap risk score at 100
        riskScore = Math.min(riskScore, 100);

        return {
            id: session._id,
            student: {
                id: session.student?._id,
                name: session.student?.name || 'Unknown',
                email: session.student?.email,
                image: session.student?.profileImage
            },
            status: session.status,
            riskScore,
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
