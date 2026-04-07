const ExamSession = require('../models/ExamSession');
const Exam = require('../models/Exam');
const User = require('../models/User');
const { asyncHandler } = require('../middlewares/errorMiddleware');

// ═══════════════════════════════════════════════════════════
// Fetch all exam results and sessions for Admin/Mentor Dashboard
// ═══════════════════════════════════════════════════════════
exports.getAllResults = asyncHandler(async (req, res) => {
    const results = await ExamSession.find()
        .populate('student', 'name email')
        .populate('exam', 'title duration category')
        .sort({ startedAt: -1, submittedAt: -1 });

    const formattedResults = results.map(session => ({
        _id: session._id,
        studentName: session.student?.name || 'Unknown Student',
        studentEmail: session.student?.email || 'N/A',
        examTitle: session.exam?.title || 'Unknown Exam',
        examDuration: session.exam?.duration || 0,
        score: session.score,
        totalMarks: session.totalMarks,
        percentage: session.percentage,
        passed: session.passed,
        status: session.status,
        tabSwitches: session.tabSwitchCount,
        totalViolations: session.violations.length,
        submittedAt: session.submittedAt || session.startedAt 
    }));

    res.json(formattedResults);
});

// ═══════════════════════════════════════════════════════════
// Get Stats for Top Cards (Total Exams, Total Students, Total Live)
// Optimized with Promise.all to fetch all counts in parallel
// ═══════════════════════════════════════════════════════════
exports.getDashboardStats = asyncHandler(async (req, res) => {
    const [totalExams, totalAttempts, liveExams, liveStudents, totalViolations] = await Promise.all([
        Exam.countDocuments(),
        ExamSession.countDocuments(),
        Exam.countDocuments({ status: 'published' }),
        ExamSession.countDocuments({ status: 'in_progress' }),
        ExamSession.countDocuments({ 'violations.0': { $exists: true } })
    ]);

    res.json({ 
        totalExams, 
        totalAttempts,
        liveExams,
        liveStudents, 
        flaggedSessions: totalViolations
    });
});

// ═══════════════════════════════════════════════════════════
// 1. Fetch All Students (Admin panel ki list ke liye)
// ═══════════════════════════════════════════════════════════
exports.getAllStudents = asyncHandler(async (req, res) => {
    const students = await User.find({ role: 'student' })
        .select('-password')
        .sort({ createdAt: -1 });
    res.json(students);
});

// ═══════════════════════════════════════════════════════════
// 2. Delete a Student
// ═══════════════════════════════════════════════════════════
exports.deleteStudent = asyncHandler(async (req, res) => {
    const studentId = req.params.id;
    const deletedStudent = await User.findByIdAndDelete(studentId);
    
    if (!deletedStudent) {
        res.status(404);
        throw new Error('Student not found');
    }
    
    res.json({ message: 'Student removed successfully!' });
});
