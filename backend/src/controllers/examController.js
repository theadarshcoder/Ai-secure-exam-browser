const Exam = require('../models/Exam');
const ExamSession = require('../models/ExamSession');
const { getRedisClient } = require('../config/redis');
const { executeCode } = require('../services/judge0');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { getTimeAgo } = require('../utils/helpers');

// ─────────────── POST /api/exams/create ───────────────
// Mentor/Admin creates a new exam and saves it to MongoDB
exports.createExam = asyncHandler(async (req, res) => {
    const { title, category, duration, totalMarks, passingMarks, questions, scheduledDate, status } = req.body;

    const isDraft = status === 'draft';

    // Validation: Required for published, but drafts can be empty-ish
    if (!title || !duration) {
        res.status(400);
        throw new Error('Title and duration are required.');
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

    const exam = new Exam({
        title,
        category: category || 'General',
        duration,
        totalMarks: totalMarks || (validQuestions ? validQuestions.reduce((sum, q) => sum + (q.marks || 1), 0) : 0),
        passingMarks: passingMarks || 40,
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
    const { title, category, duration, totalMarks, passingMarks, questions, scheduledDate, status } = req.body;

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

    let validQuestions = questions || [];
    if (isDraft) {
        validQuestions = validQuestions.filter(q => q && q.questionText && q.questionText.trim() !== '');
    }

    if (!isDraft && (!validQuestions || validQuestions.length === 0)) {
        res.status(400);
        throw new Error('At least 1 question is required to publish an exam.');
    }

    exam.title = title;
    exam.category = category || exam.category;
    exam.duration = duration;
    exam.totalMarks = totalMarks || (validQuestions ? validQuestions.reduce((sum, q) => sum + (q.marks || 1), 0) : 0);
    exam.passingMarks = passingMarks || exam.passingMarks;
    exam.questions = validQuestions;
    exam.status = status || exam.status;
    if (scheduledDate && !isNaN(new Date(scheduledDate).getTime())) {
        exam.scheduledDate = new Date(scheduledDate);
    }

    await exam.save();

    res.json({ message: 'Exam updated successfully', exam });
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
    const exams = await Exam.find({ status: 'published' })
        .select('title category duration totalMarks passingMarks scheduledDate questions creator')
        .populate('creator', 'name email')
        .sort({ scheduledDate: -1 });

    // Check which exams this student has already submitted
    const studentId = req.user.id;
    const submittedSessions = await ExamSession.find({ 
        student: studentId, 
        status: 'submitted' 
    }).select('exam');
    const submittedExamIds = new Set(submittedSessions.map(s => s.exam.toString()));

    const result = exams.map(exam => ({
        id: exam._id,
        title: exam.title,
        category: exam.category,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        questionsCount: exam.questions.length,
        startTime: exam.scheduledDate,
        creator: exam.creator?.name || 'Unknown',
        alreadySubmitted: submittedExamIds.has(exam._id.toString())
    }));

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
                creatorName: { $first: '$creatorInfo.name' }
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

    res.json({
        id: exam._id,
        title: exam.title,
        category: exam.category,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        creator: exam.creator?.name,
        questions: sanitizedQuestions // Ab fully sanitized questions bhejo
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
            const cacheStr = await redisClient.get(cacheKey);
            if (cacheStr) {
                const parsed = JSON.parse(cacheStr);
                liveAnswers = parsed.answers;
                liveQuestionStates = parsed.questionStates;
                liveRemainingTime = parsed.remainingTimeSeconds;
                liveIndex = parsed.currentQuestionIndex;
            } else {
                await redisClient.setEx(cacheKey, 86400, JSON.stringify({
                    answers: liveAnswers,
                    currentQuestionIndex: liveIndex,
                    questionStates: liveQuestionStates,
                    remainingTimeSeconds: liveRemainingTime
                }));
            }
        }

        return res.json({ 
            message: 'Exam session resumed! Your previous progress is safe.',
            sessionId: session._id,
            startedAt: session.startedAt,
            isResumed: true,                              
            resumeCount: session.resumeCount,
            currentQuestionIndex: liveIndex,
            answers: liveAnswers,                      
            questionStates: liveQuestionStates,        
            remainingTimeSeconds: liveRemainingTime  
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
        resumeCount: 0
    });
    await session.save();

    // --- Cache Initialization ---
    const redisClient = getRedisClient();
    if (redisClient) {
        const cacheKey = `exam_session:${examId}:${studentId}`;
        await redisClient.setEx(cacheKey, 86400, JSON.stringify({
            answers: {},
            currentQuestionIndex: 0,
            questionStates: initialStates,
            remainingTimeSeconds: exam.duration * 60
        }));
    }

    res.json({ 
        message: 'Exam session started! Best of luck!', 
        sessionId: session._id,
        startedAt: session.startedAt,
        isResumed: false,
        remainingTimeSeconds: session.remainingTimeSeconds,
        currentQuestionIndex: 0,
        answers: {},
        questionStates: initialStates
    });
});


// ─────────────── POST /api/exams/save-progress ───────────────
// ⭐ CRITICAL FUNCTION — Auto-Save Progress
// Frontend calls this API every 30 seconds to ensure data persistency
exports.saveProgress = asyncHandler(async (req, res) => {
    const { examId, answers, currentQuestionIndex, questionStates, remainingTimeSeconds } = req.body;
    const studentId = req.user.id;

    if (!examId) {
        res.status(400);
        throw new Error('examId is required!');
    }

    // --- Update Redis Cache (High performance) ---
    const redisClient = getRedisClient();
    if (redisClient) {
        const cacheKey = `exam_session:${examId}:${studentId}`;
        
        // Fetch existing cache to avoid overwriting missing fields
        const cacheStr = await redisClient.get(cacheKey);
        let sessionData = cacheStr ? JSON.parse(cacheStr) : {};
        
        if (answers !== undefined)              sessionData.answers = answers;
        if (currentQuestionIndex !== undefined) sessionData.currentQuestionIndex = currentQuestionIndex;
        if (questionStates !== undefined)       sessionData.questionStates = questionStates;
        if (remainingTimeSeconds !== undefined) sessionData.remainingTimeSeconds = remainingTimeSeconds;
        sessionData.lastSavedAt = new Date();
        
        await redisClient.setEx(cacheKey, 86400, JSON.stringify(sessionData));
    }

    // --- Async DB Sync (Background) ---
    await ExamSession.findOneAndUpdate(
        { exam: examId, student: studentId },
        { 
            answers, 
            currentQuestionIndex, 
            questionStates, 
            remainingTimeSeconds,
            lastSavedAt: new Date() 
        },
        { upsert: false } 
    );

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
        const cacheStr = await redisClient.get(cacheKey);
        if (cacheStr) {
            const parsed = JSON.parse(cacheStr);
            liveAnswers = parsed.answers;
            liveQuestionStates = parsed.questionStates;
            liveRemainingTime = parsed.remainingTimeSeconds;
            liveIndex = parsed.currentQuestionIndex;
        } else {
            await redisClient.setEx(cacheKey, 86400, JSON.stringify({
                answers: liveAnswers,
                currentQuestionIndex: liveIndex,
                questionStates: liveQuestionStates,
                remainingTimeSeconds: liveRemainingTime
            }));
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
            creator: exam.creator?.name,
            questions: safeQuestions
        },
        answers: liveAnswers,
        currentQuestionIndex: liveIndex,
        questionStates: liveQuestionStates,
        remainingTimeSeconds: liveRemainingTime
    });
});


// ─────────────── POST /api/exams/submit ───────────────
// Submits the exam — evaluates all question types and saves detailed results.
// MCQ: Auto-graded instantly
// Coding: Evaluated against test cases via Judge0
// Short Answer: AI suggestion generated, marked as pending_review
exports.submitExam = asyncHandler(async (req, res) => {
    const { gradeMCQ, gradeCoding, gradeShortAnswer } = require('../services/gradingService');
    const { examId, answers } = req.body;
    const studentId = req.user.id;

    const exam = await Exam.findById(examId);
    if (!exam) {
        res.status(404);
        throw new Error('Exam not found');
    }

    // 🚀 Redis Final Merge Logic
    const redisClient = getRedisClient();
    let finalAnswers = answers || {};
    if (redisClient) {
        try {
            const cacheKey = `exam_session:${examId}:${studentId}`;
            const cacheStr = await redisClient.get(cacheKey);
            if (cacheStr) {
                const parsed = JSON.parse(cacheStr);
                finalAnswers = { ...parsed.answers, ...finalAnswers };
            }
            await redisClient.del(cacheKey); // Clean up
        } catch (redisErr) {
            console.warn('⚠️ Redis error during submission, ignoring cache:', redisErr.message);
        }
    }

    // ─── Evaluate Each Question ──────────────────────
    const questionResults = [];
    let autoScore = 0;
    let hasShortAnswers = false;

    for (let index = 0; index < exam.questions.length; index++) {
        const q = exam.questions[index];
        const qId = q._id.toString();
        // Support lookup by ID (modern) or Index (legacy)
        const studentAnswer = finalAnswers[qId] !== undefined ? finalAnswers[qId] : finalAnswers[String(index)];

        if (q.type === 'mcq') {
            const result = gradeMCQ(q, studentAnswer);
            autoScore += result.marksObtained;
            questionResults.push({
                questionIndex: index,
                questionId: qId,
                type: 'mcq',
                ...result
            });

        } else if (q.type === 'coding') {
            try {
                const result = await gradeCoding(q, studentAnswer);
                autoScore += result.marksObtained;
                questionResults.push({
                    questionIndex: index,
                    questionId: qId,
                    type: 'coding',
                    ...result
                });
            } catch (err) {
                console.error(`Coding grading failed for Q${index}:`, err.message);
                questionResults.push({
                    questionIndex: index,
                    questionId: qId,
                    type: 'coding',
                    marksObtained: 0,
                    maxMarks: q.marks || 1,
                    status: 'pending_review',
                    testCaseResults: [],
                    aiReasoning: 'Code execution service unavailable. Manual review required.'
                });
                hasShortAnswers = true; // Treat as needing review
            }

        } else if (q.type === 'short') {
            hasShortAnswers = true;
            try {
                const result = await gradeShortAnswer(q, studentAnswer);
                questionResults.push({
                    questionIndex: index,
                    questionId: qId,
                    type: 'short',
                    ...result
                });
            } catch (err) {
                console.error(`Short answer grading failed for Q${index}:`, err.message);
                questionResults.push({
                    questionIndex: index,
                    questionId: qId,
                    type: 'short',
                    marksObtained: 0,
                    maxMarks: q.marks || 1,
                    status: 'pending_review',
                    aiSuggestedMarks: null,
                    aiReasoning: 'AI evaluation unavailable. Manual review required.'
                });
            }
        }
    }

    // ─── Calculate Score ─────────────────────────────
    const totalMarks = exam.totalMarks || 100;
    const finalStatus = hasShortAnswers ? 'pending_review' : 'submitted';
    const percentage = Math.round((autoScore / totalMarks) * 100);
    const passed = percentage >= (exam.passingMarks || 40);

    const session = await ExamSession.findOneAndUpdate(
        { exam: examId, student: studentId },
        { 
            answers: finalAnswers,
            score: autoScore,
            totalMarks,
            percentage,
            passed: hasShortAnswers ? false : passed, // Don't finalize pass until fully graded
            status: finalStatus,
            requiresManualGrading: hasShortAnswers,
            questionResults,
            submittedAt: new Date()
        },
        { new: true }
    );

    if (!session) {
        res.status(404);
        throw new Error('Active session not found');
    }

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
        questionResults: questionResults.map(qr => ({
            questionIndex: qr.questionIndex,
            type: qr.type,
            marksObtained: qr.marksObtained,
            maxMarks: qr.maxMarks,
            status: qr.status
        }))
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

    // Build detailed question view with answers and grading results
    const questionsWithResults = exam.questions.map((q, index) => {
        const qId = q._id.toString();
        // Lookup result by ID (new) then index (legacy)
        const result = session.questionResults.find(r => r.questionId === qId) || 
                       session.questionResults.find(r => r.questionIndex === index) || {};
                       
        // Lookup answer by ID (new) then index (legacy)
        const studentAnswer = session.answers?.[qId] !== undefined ? session.answers[qId] : session.answers?.[String(index)];

        const detail = {
            index,
            type: q.type,
            questionText: q.questionText,
            marks: q.marks,
            studentAnswer,
            marksObtained: result.marksObtained || 0,
            maxMarks: result.maxMarks || q.marks || 0,
            status: result.status || 'pending_review',
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
    // grades = [{ questionIndex, marksObtained, mentorFeedback }]

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

    // Apply mentor grades to questionResults
    for (const grade of grades) {
        const qrIndex = session.questionResults.findIndex(
            r => r.questionIndex === grade.questionIndex
        );
        
        if (qrIndex !== -1) {
            const qr = session.questionResults[qrIndex];
            const maxMarks = qr.maxMarks || 0;
            const awarded = Math.min(Math.max(Number(grade.marksObtained) || 0, 0), maxMarks);
            
            session.questionResults[qrIndex].marksObtained = awarded;
            session.questionResults[qrIndex].mentorFeedback = grade.mentorFeedback || '';
            session.questionResults[qrIndex].status = 'manually_graded';
            session.questionResults[qrIndex].gradedBy = req.user.id;
            session.questionResults[qrIndex].gradedAt = new Date();
        }
    }

    // Recalculate total score from all questionResults
    let totalScore = 0;
    session.questionResults.forEach(qr => {
        totalScore += (qr.marksObtained || 0);
    });

    const totalMarks = exam.totalMarks || 100;
    const percentage = Math.round((totalScore / totalMarks) * 100);
    const passed = percentage >= (exam.passingMarks || 40);

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
                type: type || 'Unknown',
                severity: severity || 'medium',
                details: details || '',
                timestamp: new Date()
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

    res.json({ 
        message: 'Incident logged', 
        violationCount: session.violations.length,
        tabSwitches: session.tabSwitchCount
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


// ─────────────── GET /api/exams/mentor-stats ───────────────
// Dashboard statistics for the mentor - Optimized
exports.getMentorStats = asyncHandler(async (req, res) => {
    const mongoose = require('mongoose');
    const mentorId = new mongoose.Types.ObjectId(req.user.id);

    const mentorExams = await Exam.find({ creator: mentorId }).select('_id');
    const examIds = mentorExams.map(e => e._id);

    if (examIds.length === 0) {
        return res.json({
            stats: { liveStudents: 0, totalSubmissions: 0, flags: 0, totalExams: 0 },
            activity: [],
            performance: [],
            summary: []
        });
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
        .limit(10);

    const activity = performanceSessions.map(s => ({
        name: s.student?.name || 'Student',
        action: s.violations.length > 0 ? 'flagged during' : 'submitted',
        exam: s.exam?.title || 'Exam',
        time: getTimeAgo(s.submittedAt),
        type: s.violations.length > 0 ? 'flag' : 'submit'
    }));

    res.json({
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
    });
});


// ─────────────── GET /api/exams/admin-stats ───────────────
// System-wide statistics for Administrators
exports.getAdminStats = asyncHandler(async (req, res) => {
    const allExams = await Exam.find({})
        .select('title category duration totalMarks status scheduledDate questions creator')
        .populate('creator', 'name')
        .sort({ createdAt: -1 });

    const stats = await ExamSession.aggregate([
        { $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            submittedCount: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
            flaggedCount: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$violations', []] } }, 0] }, 1, 0] } }
        }}
    ]);

    const activeSessions = await ExamSession.find({ status: 'in_progress' })
        .populate('student', 'name email')
        .populate('exam', 'title')
        .sort({ startedAt: -1 })
        .limit(20);

    const examList = await Promise.all(allExams.map(async (exam) => {
        const counts = await ExamSession.aggregate([
            { $match: { exam: exam._id } },
            { $group: {
                _id: null,
                total: { $sum: 1 },
                submitted: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
                flags: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$violations', []] } }, 0] }, 1, 0] } }
            }}
        ]);
        
        return {
            id: exam._id,
            name: exam.title,
            category: exam.category,
            students: counts[0]?.total || 0,
            submitted: counts[0]?.submitted || 0,
            flags: counts[0]?.flags || 0,
            status: exam.status === 'published' ? 'live' : 'draft',
            creator: exam.creator?.name || 'Unknown',
            duration: exam.duration,
            questionsCount: exam.questions.length
        };
    }));

    res.json({
        stats: {
            totalExams: allExams.length,
            totalSessions: stats[0]?.totalSessions || 0,
            totalSubmissions: stats[0]?.submittedCount || 0,
            flags: stats[0]?.flaggedCount || 0,
            activeSessions: (stats[0]?.totalSessions || 0) - (stats[0]?.submittedCount || 0)
        },
        sessions: activeSessions.map(s => ({
            id: s._id,
            name: s.student?.name || 'Student',
            exam: s.exam?.title || 'Exam',
            risk: s.violations.length > 3 ? 'High' : s.violations.length > 0 ? 'Medium' : 'Low',
            time: s.startedAt ? `${Math.round((Date.now() - new Date(s.startedAt)) / 60000)}m` : 'N/A'
        })),
        examList,
        incidents: [] // Placeholder for detailed incident logs
    });
});


// ─────────────── POST /api/exams/run-code ───────────────
// Run Coding Question against Test Cases or Raw execution
exports.runCode = asyncHandler(async (req, res) => {
    const { examId, questionId, sourceCode, language, isSubmit } = req.body;

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

    // FORMAL SUBMISSION - Evaluate against all test cases
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
                input: tc.isHidden ? 'Hidden Test Case' : tc.input,
                expectedOutput: tc.isHidden ? 'Hidden' : tc.expectedOutput,
                actualOutput: tc.isHidden ? 'Hidden' : executionResult.output,
            });
        } else {
            allPassed = false;
            results.push({ 
                testCaseId: i + 1, 
                passed: false, 
                error: executionResult.error 
            });
            break; 
        }
    }

    res.json({ allPassed, results, isRawExecution: false });
});

// ─────────────── POST /api/exams/help ───────────────
// Student requests help from mentor/admin
exports.requestHelp = asyncHandler(async (req, res) => {
    const { msg } = req.body;
    if (!msg || !msg.trim()) {
        res.status(400);
        throw new Error('Message is required.');
    }

    const userName = req.user.name || req.user.email;
    const supportMessage = {
        studentName: userName,
        studentEmail: req.user.email,
        studentId: req.user._id,
        message: msg,
        timestamp: new Date()
    };

    const io = req.app.get('io');
    if (io) {
        io.to('role_mentor').to('role_admin').emit('student_need_help', supportMessage);
    }

    res.status(200).json({ success: true, message: 'Support request sent.' });
});
