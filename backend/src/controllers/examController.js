const Exam = require('../models/Exam');
const ExamSession = require('../models/ExamSession');
const { getRedisClient } = require('../config/redis');
const { executeCode } = require('../services/judge0'); // YEH LINE ADD KARO

// ─────────────── POST /api/exams/create ───────────────
// Mentor/Admin creates a new exam and saves it to MongoDB
exports.createExam = async (req, res) => {
    try {
        const { title, category, duration, totalMarks, passingMarks, questions, scheduledDate } = req.body;

        if (!title || !duration || !questions || questions.length === 0) {
            return res.status(400).json({ error: 'Title, duration, and at least 1 question are required.' });
        }

        const exam = new Exam({
            title,
            category: category || 'General',
            duration,
            totalMarks: totalMarks || questions.reduce((sum, q) => sum + (q.marks || 1), 0),
            passingMarks: passingMarks || 40,
            questions,
            creator: req.user.id,
            status: 'published',
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
    } catch (error) {
        console.error('Exam creation failed:', error);
        res.status(500).json({ error: 'Failed to create exam', details: error.message });
    }
};

// ─────────────── GET /api/exams/active ───────────────
// Students see all published exams they haven't submitted yet
exports.getActiveExams = async (req, res) => {
    try {
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
    } catch (error) {
        console.error('Failed to fetch active exams:', error);
        res.status(500).json({ error: 'Failed to fetch exams', details: error.message });
    }
};

// ─────────────── GET /api/exams/mentor-list ───────────────
// Mentors see exams THEY created + submission stats
exports.getMentorExams = async (req, res) => {
    try {
        const exams = await Exam.find({ creator: req.user.id })
            .select('title category duration totalMarks status scheduledDate questions')
            .sort({ createdAt: -1 });

        const result = await Promise.all(exams.map(async (exam) => {
            const sessionCount = await ExamSession.countDocuments({ exam: exam._id });
            const submittedCount = await ExamSession.countDocuments({ exam: exam._id, status: 'submitted' });
            const flaggedCount = await ExamSession.countDocuments({ 
                exam: exam._id, 
                'violations.0': { $exists: true } 
            });

            return {
                id: exam._id,
                name: exam.title,
                category: exam.category,
                students: sessionCount,
                submitted: submittedCount,
                flags: flaggedCount,
                status: exam.status === 'published' ? 'live' : 'draft',
                time: exam.scheduledDate,
                questionsCount: exam.questions.length,
                duration: exam.duration
            };
        }));

        res.json(result);
    } catch (error) {
        console.error('Failed to fetch mentor exams:', error);
        res.status(500).json({ error: 'Failed to fetch exams' });
    }
};

// ─────────────── GET /api/exams/:id ───────────────
// Load exam for student (STRIPS correct answers for security)
exports.getExamById = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id)
            .populate('creator', 'name');

        if (!exam) return res.status(404).json({ error: 'Exam not found' });

        // Strip correct answers so student can't cheat via network tab
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
            id: exam._id,
            title: exam.title,
            category: exam.category,
            duration: exam.duration,
            totalMarks: exam.totalMarks,
            creator: exam.creator?.name,
            questions: safeQuestions
        });
    } catch (error) {
        console.error('Failed to fetch exam:', error);
        res.status(500).json({ error: 'Failed to fetch exam' });
    }
};

// ─────────────── POST /api/exams/start ───────────────
// Student starts the exam — an exam session is created
// If a session already exists (e.g., disconnection), resume the session
exports.startExam = async (req, res) => {
    try {
        const { examId } = req.body;
        const studentId = req.user.id;

        // Step 1: Check if a session already exists
        let session = await ExamSession.findOne({ exam: examId, student: studentId });
        
        // Block re-attempts if already submitted
        if (session && (session.status === 'submitted' || session.status === 'auto_submitted')) {
            return res.status(400).json({ error: 'You have already submitted this exam.' });
        }

        // Handle re-entry (resume case — e.g., internet restored)
        if (session) {
            session.resumeCount += 1;      // Increment resume count
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
        if (!exam) return res.status(404).json({ error: 'Exam not found' });

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
    } catch (error) {
        console.error('Failed to start exam:', error);
        res.status(500).json({ error: 'Failed to start exam session' });
    }
};


// ─────────────── POST /api/exams/save-progress ───────────────
// ⭐ CRITICAL FUNCTION — Auto-Save Progress
// Frontend calls this API every 30 seconds to ensure data persistency
// even in case of power failure or accidental closure.

exports.saveProgress = async (req, res) => {
    try {
        const { examId, answers, currentQuestionIndex, questionStates, remainingTimeSeconds } = req.body;
        const studentId = req.user.id;

        // Validation
        if (!examId) {
            return res.status(400).json({ error: 'examId is required!' });
        }

        // 🚀 Redis Implementation Request
        const redisClient = getRedisClient();
        
        if (redisClient) {
            const cacheKey = `exam_session:${examId}:${studentId}`;
            // Try fetch existing cache
            const cacheStr = await redisClient.get(cacheKey);
            let sessionData = cacheStr ? JSON.parse(cacheStr) : {};
            
            if (answers !== undefined)              sessionData.answers = answers;
            if (currentQuestionIndex !== undefined) sessionData.currentQuestionIndex = currentQuestionIndex;
            if (questionStates !== undefined)       sessionData.questionStates = questionStates;
            if (remainingTimeSeconds !== undefined) sessionData.remainingTimeSeconds = remainingTimeSeconds;
            
            await redisClient.setEx(cacheKey, 86400, JSON.stringify(sessionData));
            
            return res.json({ 
                message: 'Progress cached instantly!',
                lastSavedAt: new Date(),
                answeredCount: Object.keys(sessionData.answers || {}).length
            });
        }

        // Fallback to MongoDB if Redis is dead
        // Retrieve active session
        const session = await ExamSession.findOne({ 
            exam: examId, 
            student: studentId,
            status: 'in_progress'     // Only update in-progress sessions
        });

        if (!session) {
            return res.status(404).json({ error: 'Active session not found. Please start the exam first.' });
        }

        // Update progress for provided fields
        if (answers !== undefined)              session.answers = answers;
        if (currentQuestionIndex !== undefined) session.currentQuestionIndex = currentQuestionIndex;
        if (questionStates !== undefined)       session.questionStates = questionStates;
        if (remainingTimeSeconds !== undefined) session.remainingTimeSeconds = remainingTimeSeconds;
        
        session.lastSavedAt = new Date();

        await session.save();

        res.json({ 
            message: 'Progress saved!',
            lastSavedAt: session.lastSavedAt,
            answeredCount: Object.keys(session.answers || {}).length
        });
    } catch (error) {
        console.error('Progress save failed:', error);
        res.status(500).json({ error: 'Failed to save progress' });
    }
};


// ─────────────── GET /api/exams/resume/:examId ───────────────
// Restores the full state for a student returning to an exam session.
// Unlike startExam, this ONLY retrieves existing session data without modification.

exports.resumeExam = async (req, res) => {
    try {
        const examId = req.params.examId;
        const studentId = req.user.id;

        // Find session
        const session = await ExamSession.findOne({ 
            exam: examId, 
            student: studentId 
        });

        if (!session) {
            return res.status(404).json({ error: 'No session found. Please start the exam first.' });
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

        // Fetch exam details (stripped of answers for security)
        const exam = await Exam.findById(examId).populate('creator', 'name');
        if (!exam) return res.status(404).json({ error: 'Exam not found' });

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

        // Update resume count
        session.resumeCount += 1;
        session.lastSavedAt = new Date();
        await session.save();

        // 🚀 Redis Pull
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
            message: 'Session restored! Resume from where you left off.',
            isCompleted: false,
            sessionId: session._id,
            
            // Exam information
            exam: {
                id: exam._id,
                title: exam.title,
                category: exam.category,
                duration: exam.duration,
                totalMarks: exam.totalMarks,
                creator: exam.creator?.name,
                questions: safeQuestions
            },

            // Saved progress data
            answers: liveAnswers,
            currentQuestionIndex: liveIndex,
            questionStates: liveQuestionStates,
            remainingTimeSeconds: liveRemainingTime,
            
            // Meta information
            startedAt: session.startedAt,
            resumeCount: session.resumeCount,
            lastSavedAt: session.lastSavedAt,
            violationCount: session.violations.length
        });
    } catch (error) {
        console.error('Resume failed:', error);
        res.status(500).json({ error: 'Failed to resume exam' });
    }
};


// ─────────────── POST /api/exams/submit ───────────────
// Submits the exam — calculates MCQ scores, saves answers, and finalizes results.
exports.submitExam = async (req, res) => {
    try {
        const { examId, answers } = req.body;
        const studentId = req.user.id;

        const exam = await Exam.findById(examId);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });

        // 🚀 Redis Final Dump merge
        const redisClient = getRedisClient();
        let finalAnswers = answers;
        if (redisClient) {
            const cacheKey = `exam_session:${examId}:${studentId}`;
            const cacheStr = await redisClient.get(cacheKey);
            if (cacheStr) {
                const parsed = JSON.parse(cacheStr);
                finalAnswers = { ...parsed.answers, ...answers }; // Merge payload from client on top of cache
            }
            // Clear cache after merging
            await redisClient.del(cacheKey);
        }

        // ─── Auto-Score MCQ Questions ────────────────
        let score = 0;
        const questionResults = {};   // Individual question breakdown

        exam.questions.forEach((q, index) => {
            const studentAnswer = finalAnswers[String(index)];
            const result = { type: q.type, marks: q.marks || 1, scored: 0, correct: false };

            if (q.type === 'mcq' && studentAnswer !== undefined) {
                if (Number(studentAnswer) === q.correctOption) {
                    result.scored = q.marks || 1;
                    result.correct = true;
                    score += result.scored;
                }
            }

            // Short answer — manual grading scheduled for later
            // Current logic: Reward 50% marks for any attempt
            if (q.type === 'short' && studentAnswer && String(studentAnswer).trim().length > 0) {
                result.scored = Math.ceil((q.marks || 1) * 0.5);
                score += result.scored;
            }

            // Coding — manual/automated test-case grading scheduled for later
            // Current logic: Reward 50% marks for any code attempt
            if (q.type === 'coding' && studentAnswer && String(studentAnswer).trim().length > 0) {
                result.scored = Math.ceil((q.marks || 1) * 0.5);
                score += result.scored;
            }

            questionResults[String(index)] = result;
        });

        const percentage = Math.round((score / exam.totalMarks) * 100);
        const passed = percentage >= ((exam.passingMarks / exam.totalMarks) * 100);

        // ─── Session Update ──────────────────────────
        const session = await ExamSession.findOneAndUpdate(
            { exam: examId, student: studentId },
            {
                answers: finalAnswers,
                score,
                totalMarks: exam.totalMarks,
                percentage,
                passed,
                status: 'submitted',
                submittedAt: new Date(),
                remainingTimeSeconds: 0,        // Time expired upon submission
                lastSavedAt: new Date()
            },
            { upsert: true, new: true }
        );

        res.json({
            message: 'Exam submitted successfully!',
            sessionId: session._id,
            score,
            totalMarks: exam.totalMarks,
            percentage,
            passed,
            questionResults    // Full results breakdown for frontend display
        });
    } catch (error) {
        console.error('Exam submission failed:', error);
        res.status(500).json({ error: 'Failed to submit exam', details: error.message });
    }
};

// ─────────────── POST /api/exams/incident ───────────────
// Logs a proctoring violation to the session
exports.logIncident = async (req, res) => {
    try {
        const { examId, type, severity, details } = req.body;
        const studentId = req.user.id;

        const violation = {
            type: type || 'Unknown',
            severity: severity || 'medium',
            details: details || '',
            timestamp: new Date()
        };

        const update = {
            $push: { violations: violation }
        };

        // Auto-increment tab switch counter
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
    } catch (error) {
        console.error('Incident logging failed:', error);
        res.status(500).json({ error: 'Failed to log incident' });
    }
};

// ─────────────── GET /api/exams/submissions/:examId ───────────────
// Mentors view all submissions for a specific exam
exports.getExamSubmissions = async (req, res) => {
    try {
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
    } catch (error) {
        console.error('Failed to fetch submissions:', error);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
};

// ─────────────── GET /api/exams/mentor-stats ───────────────
// Dashboard statistics for the mentor
exports.getMentorStats = async (req, res) => {
    try {
        const mentorExams = await Exam.find({ creator: req.user.id }).select('_id');
        const examIds = mentorExams.map(e => e._id);

        const totalStudents = await ExamSession.countDocuments({ exam: { $in: examIds } });
        const submittedCount = await ExamSession.countDocuments({ exam: { $in: examIds }, status: 'submitted' });
        const flaggedCount = await ExamSession.countDocuments({ 
            exam: { $in: examIds }, 
            'violations.0': { $exists: true }
        });

        // Student Performance (List of recent submissions)
        const performanceSessions = await ExamSession.find({ exam: { $in: examIds }, status: 'submitted' })
            .populate('student', 'name')
            .populate('exam', 'title')
            .sort({ submittedAt: -1 })
            .limit(10);

        const performance = performanceSessions.map(s => ({
            name: s.student?.name || 'Unknown',
            exam: s.exam?.title || 'Exam',
            score: s.score || 0,
            time: s.submittedAt ? new Date(s.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
            status: s.violations.length > 0 ? 'Flagged' : 'Passed'
        }));

        // Results Summary (Aggregated stats for mentor's exams)
        const summaryStats = await ExamSession.aggregate([
            { $match: { exam: { $in: examIds }, status: 'submitted' } },
            { $group: {
                _id: '$exam',
                avgScore: { $avg: '$score' },
                highScore: { $max: '$score' },
                lowScore: { $min: '$score' },
                submissions: { $count: {} },
                passedCount: { $sum: { $cond: [{ $gte: ['$score', 33] }, 1, 0] } } // Assuming 33 is pass
            }},
            { $lookup: {
                from: 'exams',
                localField: '_id',
                foreignField: '_id',
                as: 'examInfo'
            }},
            { $unwind: '$examInfo' }
        ]);

        const summary = summaryStats.map(s => ({
            exam: s.examInfo.title,
            submissions: s.submissions,
            avg: Math.round(s.avgScore),
            high: s.highScore,
            low: s.lowScore,
            pass: Math.round((s.passedCount / s.submissions) * 100)
        }));

        // Activity Feed (built from recent submissions)
        const activity = performanceSessions.map(s => ({
            name: s.student?.name || 'Student',
            action: s.violations.length > 0 ? 'flagged during' : 'submitted',
            exam: s.exam?.title || 'Exam',
            time: s.submittedAt ? getTimeAgo(s.submittedAt) : 'Recently',
            type: s.violations.length > 0 ? 'flag' : 'submit'
        }));

        res.json({
            stats: {
                liveStudents: totalStudents - submittedCount,
                totalSubmissions: submittedCount,
                flags: flaggedCount,
                totalExams: mentorExams.length
            },
            activity,
            performance,
            summary
        });
    } catch (error) {
        console.error('Failed to fetch mentor stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

// Helper: relative time string
function getTimeAgo(date) {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

// ─────────────── GET /api/exams/admin-stats ───────────────
// System-wide statistics for Administrators (unfiltered by creator)
exports.getAdminStats = async (req, res) => {
    try {
        const allExams = await Exam.find({})
            .select('title category duration totalMarks status scheduledDate questions creator')
            .populate('creator', 'name')
            .sort({ createdAt: -1 });

        const totalSessions = await ExamSession.countDocuments({});
        const submittedCount = await ExamSession.countDocuments({ status: 'submitted' });
        const flaggedCount = await ExamSession.countDocuments({ 
            'violations.0': { $exists: true }
        });

        // Active exam sessions (in progress)
        const activeSessions = await ExamSession.find({ status: 'in_progress' })
            .populate('student', 'name email')
            .populate('exam', 'title')
            .sort({ startedAt: -1 })
            .limit(20);

        const sessions = activeSessions.map(s => ({
            id: s._id,
            name: s.student?.name || 'Student',
            exam: s.exam?.title || 'Exam',
            risk: s.violations.length > 3 ? 'High' : s.violations.length > 0 ? 'Medium' : 'Low',
            score: 100 - (s.violations.length * 10),
            time: s.startedAt ? `${Math.round((Date.now() - new Date(s.startedAt)) / 60000)}m` : 'N/A'
        }));

        // Exam inventory with statistics
        const examList = await Promise.all(allExams.map(async (exam) => {
            const sessionCount = await ExamSession.countDocuments({ exam: exam._id });
            const submitted = await ExamSession.countDocuments({ exam: exam._id, status: 'submitted' });
            const flags = await ExamSession.countDocuments({ 
                exam: exam._id, 
                'violations.0': { $exists: true } 
            });

            return {
                id: exam._id,
                name: exam.title,
                category: exam.category,
                students: sessionCount,
                submitted,
                flags,
                status: exam.status === 'published' ? 'live' : 'draft',
                creator: exam.creator?.name || 'Unknown',
                duration: exam.duration,
                questionsCount: exam.questions.length
            };
        }));

        // Recent incident log across all sessions
        const recentViolations = await ExamSession.find({ 'violations.0': { $exists: true } })
            .populate('student', 'name')
            .populate('exam', 'title')
            .sort({ 'violations.timestamp': -1 })
            .limit(10);

        const incidents = [];
        recentViolations.forEach(s => {
            s.violations.slice(-3).forEach(v => {
                incidents.push({
                    id: `INC-${v._id}`,
                    type: v.type,
                    severity: v.severity,
                    details: `${s.student?.name || 'Student'} during ${s.exam?.title || 'Exam'}: ${v.details || v.type}`,
                    timestamp: v.timestamp
                });
            });
        });

        res.json({
            stats: {
                totalExams: allExams.length,
                totalSessions,
                totalSubmissions: submittedCount,
                flags: flaggedCount,
                activeSessions: totalSessions - submittedCount
            },
            sessions,
            examList,
            incidents: incidents.slice(0, 10)
        });
    } catch (error) {
        console.error('Failed to fetch admin stats:', error);
        res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
};
// 4. Run Coding Question against Test Cases (For Students)
exports.runCode = async (req, res) => {
  try {
    const { examId, questionId, sourceCode, language } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const question = exam.questions.id(questionId);
    if (!question || question.type !== 'coding') {
      return res.status(400).json({ message: 'Invalid coding question' });
    }

    const results = [];
    let allPassed = true;

    // Har test case ke liye loop chalega
    for (let i = 0; i < question.testCases.length; i++) {
      const tc = question.testCases[i];
      
      // Judge0 ko code aur input bhejo
      const executionResult = await executeCode(sourceCode, language, tc.input);

      if (executionResult.success) {
        // Output match karo (trim() lagaya hai taaki extra space problem na kare)
        const passed = executionResult.output.trim() === tc.expectedOutput.trim();
        if (!passed) allPassed = false;

        results.push({
          testCaseId: i + 1,
          passed: passed,
          // Agar test case hidden hai, toh student ko asli input/output mat dikhao
          input: tc.isHidden ? 'Hidden Test Case' : tc.input,
          expectedOutput: tc.isHidden ? 'Hidden' : tc.expectedOutput,
          actualOutput: tc.isHidden ? 'Hidden' : executionResult.output,
          time: executionResult.time,
          memory: executionResult.memory
        });
      } else {
        // Compilation ya Syntax Error
        allPassed = false;
        results.push({ 
          testCaseId: i + 1, 
          passed: false, 
          error: executionResult.error 
        });
        break; // Agar syntax error hai toh aage ke test cases chalane ka fayda nahi
      }
    }

    res.status(200).json({ allPassed, results });
  } catch (error) {
    res.status(500).json({ message: 'Error executing code', error: error.message });
  }
};
