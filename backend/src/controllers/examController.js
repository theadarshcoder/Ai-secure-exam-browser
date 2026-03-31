const Exam = require('../models/Exam');
const ExamSession = require('../models/ExamSession');

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
            scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date()
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
                text: q.text,
                marks: q.marks,
            };
            if (q.type === 'mcq') safe.options = q.options;
            if (q.type === 'short') safe.maxWords = q.maxWords;
            if (q.type === 'coding') {
                safe.language = q.language;
                safe.starterCode = q.starterCode;
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
// Start an exam session (creates ExamSession record)
exports.startExam = async (req, res) => {
    try {
        const { examId } = req.body;
        const studentId = req.user.id;

        // Check if session already exists
        let session = await ExamSession.findOne({ exam: examId, student: studentId });
        
        if (session && session.status === 'submitted') {
            return res.status(400).json({ error: 'You have already submitted this exam.' });
        }

        if (!session) {
            const exam = await Exam.findById(examId);
            if (!exam) return res.status(404).json({ error: 'Exam not found' });

            session = new ExamSession({
                exam: examId,
                student: studentId,
                totalMarks: exam.totalMarks,
                startedAt: new Date()
            });
            await session.save();
        }

        res.json({ 
            message: 'Exam session started', 
            sessionId: session._id,
            startedAt: session.startedAt 
        });
    } catch (error) {
        console.error('Failed to start exam:', error);
        res.status(500).json({ error: 'Failed to start exam session' });
    }
};

// ─────────────── POST /api/exams/submit ───────────────
// Submit exam — auto-score MCQs, save answers, calculate results
exports.submitExam = async (req, res) => {
    try {
        const { examId, answers } = req.body;
        const studentId = req.user.id;

        const exam = await Exam.findById(examId);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });

        // Auto-score MCQ questions
        let score = 0;
        exam.questions.forEach((q, index) => {
            const studentAnswer = answers[String(index)];
            if (q.type === 'mcq' && studentAnswer !== undefined) {
                if (Number(studentAnswer) === q.correctIndex) {
                    score += q.marks || 1;
                }
            }
            // Short answer and coding would need manual grading in full version
            // For MVP: give partial marks if answered
            if (q.type === 'short' && studentAnswer && String(studentAnswer).trim().length > 0) {
                score += Math.ceil((q.marks || 1) * 0.5); // 50% for attempt
            }
        });

        const percentage = Math.round((score / exam.totalMarks) * 100);
        const passed = percentage >= ((exam.passingMarks / exam.totalMarks) * 100);

        // Update or create session
        const session = await ExamSession.findOneAndUpdate(
            { exam: examId, student: studentId },
            {
                answers,
                score,
                totalMarks: exam.totalMarks,
                percentage,
                passed,
                status: 'submitted',
                submittedAt: new Date()
            },
            { upsert: true, new: true }
        );

        res.json({
            message: 'Exam submitted successfully',
            sessionId: session._id,
            score,
            totalMarks: exam.totalMarks,
            percentage,
            passed
        });
    } catch (error) {
        console.error('Exam submission failed:', error);
        res.status(500).json({ error: 'Failed to submit exam', details: error.message });
    }
};

// ─────────────── POST /api/exams/incident ───────────────
// Log a proctoring violation to the session
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
// Mentor views all submissions for a specific exam
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
// Dashboard stats for mentor
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

        // Recent activity
        const recentSessions = await ExamSession.find({ exam: { $in: examIds } })
            .populate('student', 'name')
            .populate('exam', 'title')
            .sort({ updatedAt: -1 })
            .limit(10);

        const activity = recentSessions.map(s => ({
            name: s.student?.name || 'Student',
            action: s.status === 'submitted' ? 'submitted' : s.violations.length > 0 ? 'flagged' : 'started',
            exam: s.exam?.title || 'Exam',
            time: getTimeAgo(s.updatedAt),
            type: s.violations.length > 0 ? 'flag' : s.status === 'submitted' ? 'pass' : 'review'
        }));

        res.json({
            stats: {
                liveStudents: totalStudents - submittedCount,
                totalSubmissions: submittedCount,
                flags: flaggedCount,
                totalExams: mentorExams.length
            },
            activity
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
// Admin sees ALL exams system-wide (not filtered by creator)
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

        // Active sessions (in_progress)
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

        // Exam list with stats
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

        // Recent incidents from all sessions
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
