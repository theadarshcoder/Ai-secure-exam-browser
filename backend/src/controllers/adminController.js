const ExamSession = require('../models/ExamSession');
const Exam = require('../models/Exam');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const axios = require('axios');
const mongoose = require('mongoose');

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
// User Management (Students & Mentors)
// ═══════════════════════════════════════════════════════════
exports.getAllStudents = asyncHandler(async (req, res) => {
    const students = await User.find({ role: 'student' })
        .select('-password')
        .sort({ createdAt: -1 });
    res.json(students);
});

exports.getAllMentors = asyncHandler(async (req, res) => {
    const mentors = await User.find({ role: 'mentor' })
        .select('-password')
        .sort({ createdAt: -1 });
    res.json(mentors);
});

exports.deleteStudent = asyncHandler(async (req, res) => {
    const studentId = req.params.id;
    const deletedStudent = await User.findByIdAndDelete(studentId);
    
    if (!deletedStudent) {
        res.status(404);
        throw new Error('Student not found');
    }

    // Log the action
    await AuditLog.create({
        adminId: req.user._id,
        action: 'DELETE_STUDENT',
        details: { name: deletedStudent.name, email: deletedStudent.email }
    });
    
    res.json({ message: 'Student removed successfully!' });
});

exports.deleteMentor = asyncHandler(async (req, res) => {
    const mentorId = req.params.id;
    const deletedMentor = await User.findByIdAndDelete(mentorId);
    
    if (!deletedMentor) {
        res.status(404);
        throw new Error('Mentor not found');
    }

    // Log the action
    await AuditLog.create({
        adminId: req.user._id,
        action: 'DELETE_MENTOR',
        details: { name: deletedMentor.name, email: deletedMentor.email }
    });
    
    res.json({ message: 'Mentor removed successfully!' });
});

// ═══════════════════════════════════════════════════════════
// System Health & Logs
// ═══════════════════════════════════════════════════════════

exports.getSystemHealth = asyncHandler(async (req, res) => {
    // 1. Database Health
    const dbStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'degraded';
    
    // 2. Judge0 Health (Ping the default or configured URL)
    const judge0Url = process.env.JUDGE0_API_URL || 'https://ce.judge0.com';
    let judge0Status = 'unknown';
    try {
        const start = Date.now();
        await axios.get(`${judge0Url}/health`, { timeout: 3000 });
        const latency = Date.now() - start;
        judge0Status = latency < 1000 ? 'healthy' : 'high-latency';
    } catch (e) {
        judge0Status = 'unreachable';
    }

    // 3. Current Live Sessions
    const liveSessionsCount = await ExamSession.countDocuments({ status: 'in_progress' });

    res.json({
        database: dbStatus,
        judge0: judge0Status,
        liveSessions: liveSessionsCount,
        timestamp: new Date()
    });
});

exports.getAuditLogs = asyncHandler(async (req, res) => {
    const logs = await AuditLog.find()
        .populate('adminId', 'name email')
        .sort({ createdAt: -1 })
        .limit(100);
    res.json(logs);
});
