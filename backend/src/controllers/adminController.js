const ExamSession = require('../models/ExamSession');
const Exam = require('../models/Exam');
const User = require('../models/User');

// ═══════════════════════════════════════════════════════════
// Fetch all exam results and sessions for Admin/Mentor Dashboard
// ═══════════════════════════════════════════════════════════
exports.getAllResults = async (req, res) => {
    try {
        // Hamare advanced schema me fields ka naam 'student' aur 'exam' hai
        // studentId aur examId nahi, isliye .populate('student') lagega.
        const results = await ExamSession.find()
            .populate('student', 'name email')
            .populate('exam', 'title duration category')
            .sort({ startedAt: -1, submittedAt: -1 }); // Latest sabse upar

        // Cleanup karke clean table array bhejenge frontend ko
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

        res.status(200).json(formattedResults);
    } catch (error) {
        console.error('Error fetching results:', error);
        res.status(500).json({ message: 'Error fetching results', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════
// Get Stats for Top Cards (Total Exams, Total Students, Total Live)
// ═══════════════════════════════════════════════════════════
exports.getDashboardStats = async (req, res) => {
    try {
        const totalExams = await Exam.countDocuments();
        const totalAttempts = await ExamSession.countDocuments();
        
        // Advanced metrics jo humne abhi banaye:
        const liveExams = await Exam.countDocuments({ status: 'published' });
        const liveStudents = await ExamSession.countDocuments({ status: 'in_progress' });
        const totalViolations = await ExamSession.countDocuments({ 'violations.0': { $exists: true } });

        res.status(200).json({ 
            totalExams, 
            totalAttempts,
            liveExams,         // Dashboard me live exams dikhane ke liye
            liveStudents,      // Kitne bache current time me test de rahe hain
            flaggedSessions: totalViolations // Kitne attempts me cheating pakdi gayi
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: 'Error fetching stats', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════
// 1. Fetch All Students (Admin panel ki list ke liye)
// ═══════════════════════════════════════════════════════════
exports.getAllStudents = async (req, res) => {
    try {
        // Sirf students ko layenge, aur password nahi bhejenge (-password)
        const students = await User.find({ role: 'student' }).select('-password').sort({ createdAt: -1 });
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching students', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════
// 2. Delete a Student
// ═══════════════════════════════════════════════════════════
exports.deleteStudent = async (req, res) => {
    try {
        const studentId = req.params.id;
        const deletedStudent = await User.findByIdAndDelete(studentId);
        
        if (!deletedStudent) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        res.status(200).json({ message: 'Student removed successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting student', error: error.message });
    }
};
