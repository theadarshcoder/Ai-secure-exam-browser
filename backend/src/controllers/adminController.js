const ExamSession = require('../models/ExamSession');
const Exam = require('../models/Exam');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Setting = require('../models/Setting');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const axios = require('axios');
const mongoose = require('mongoose');
const { getCache, setCache, TTL_API_CACHE } = require('../services/cacheService');

// ═══════════════════════════════════════════════════════════
// Fetch all exam results and sessions for Admin/Mentor Dashboard
// ═══════════════════════════════════════════════════════════
exports.getAllResults = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const results = await ExamSession.find()
        .populate('student', 'name email')
        .populate('exam', 'title duration category')
        .sort({ startedAt: -1, submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const total = await ExamSession.countDocuments();

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
        totalViolations: session.violations?.length || 0,
        submittedAt: session.submittedAt || session.startedAt 
    }));

    res.json({
        results: formattedResults,
        total,
        page,
        pages: Math.ceil(total / limit)
    });
});

// ═══════════════════════════════════════════════════════════
// Fetch all active/live exam sessions
// ═══════════════════════════════════════════════════════════
exports.getLiveSessions = asyncHandler(async (req, res) => {
    const sessions = await ExamSession.find({
        status: { $in: ['in_progress', 'flagged', 'blocked'] }
    })
    .populate('student', 'name email profilePicture')
    .populate('exam', 'title duration category')
    .sort({ startedAt: -1 })
    .lean();

    const formatted = sessions.map(s => ({
        _id: s._id,
        studentName: s.student?.name || 'Unknown',
        studentEmail: s.student?.email || 'N/A',
        studentPhoto: s.student?.profilePicture,
        examTitle: s.exam?.title || 'Unknown Exam',
        status: s.status,
        isBlocked: s.isBlocked,
        violationCount: s.violationCount || 0,
        startedAt: s.startedAt,
        risk: s.violationCount > 5 ? 'High' : s.violationCount > 2 ? 'Medium' : 'Low'
    }));

    res.json(formatted);
});

// ═══════════════════════════════════════════════════════════
// Get Stats for Top Cards (Total Exams, Total Students, Total Live)
// ═══════════════════════════════════════════════════════════
exports.getDashboardStats = asyncHandler(async (req, res) => {
    const cacheKey = 'admin_dashboard_stats_global';
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const [totalExams, totalAttempts, liveExams, liveStudents, totalViolations, totalStudents] = await Promise.all([
        Exam.countDocuments().lean(),
        ExamSession.countDocuments().lean(),
        Exam.countDocuments({ status: 'published' }).lean(),
        ExamSession.countDocuments({ status: 'in_progress' }).lean(),
        ExamSession.countDocuments({ 'violations.0': { $exists: true } }).lean(),
        User.countDocuments({ role: 'student' }).lean()
    ]);

    const result = { 
        totalExams, 
        totalAttempts,
        liveExams,
        liveStudents, 
        totalStudents,
        flaggedSessions: totalViolations
    };

    await setCache(cacheKey, result, TTL_API_CACHE);
    res.json(result);
});

// ═══════════════════════════════════════════════════════════
// User Management (Students & Mentors)
// ═══════════════════════════════════════════════════════════
exports.getAllStudents = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const students = await User.find({ role: 'student' })
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const total = await User.countDocuments({ role: 'student' });

    res.json({
        students,
        total,
        page,
        pages: Math.ceil(total / limit)
    });
});

exports.getAllMentors = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const mentors = await User.find({ role: { $in: ['mentor', 'super_mentor'] } })
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const total = await User.countDocuments({ role: { $in: ['mentor', 'super_mentor'] } });

    res.json({
        mentors,
        total,
        page,
        pages: Math.ceil(total / limit)
    });
});

exports.getAllAdmins = asyncHandler(async (req, res) => {
    const admins = await User.find({ role: 'admin' })
        .select('-password')
        .sort({ createdAt: -1 });
    res.json(admins);
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
        adminId: req.user.id,
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
        adminId: req.user.id,
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

// Delete a single audit log
exports.deleteAuditLog = asyncHandler(async (req, res) => {
    const log = await AuditLog.findByIdAndDelete(req.params.id);
    if (!log) {
        res.status(404);
        throw new Error('Audit log not found');
    }
    res.json({ message: 'Audit log deleted' });
});

// Clear all audit logs
exports.clearAuditLogs = asyncHandler(async (req, res) => {
    await AuditLog.deleteMany({});
    res.json({ message: 'All audit logs cleared' });
});

// ═══════════════════════════════════════════════════════════
// Bulk Import Users
// ═══════════════════════════════════════════════════════════

exports.bulkImportUsers = asyncHandler(async (req, res) => {
    const { users } = req.body;
    
    if (!users || !Array.isArray(users)) {
        res.status(400);
        throw new Error('Please provide a valid array of users');
    }

    const results = [];
    const validUsersToInsert = [];
    const bcrypt = require('bcryptjs');

    // Generate a shared salt for this batch to optimize hashing
    const salt = await bcrypt.genSalt(10);

    // Fetch existing emails to avoid individual DB calls
    const emailsToImport = users.map(u => u.email);
    const existingUsers = await User.find({ email: { $in: emailsToImport } }).select('email');
    const existingEmailsSet = new Set(existingUsers.map(u => u.email));

    for (const userData of users) {
        if (existingEmailsSet.has(userData.email)) {
            results.push({ email: userData.email, status: 'failed', reason: 'Email already exists' });
            continue;
        }

        // Use password from CSV if provided, else generate 6-digit random one
        let plainPassword = userData.password;
        if (!plainPassword || String(plainPassword).trim() === '') {
            const randNum = Math.floor(100000 + Math.random() * 899999);
            plainPassword = `password${randNum}`;
        }
        
        const hashedPassword = await bcrypt.hash(plainPassword, salt);

        validUsersToInsert.push({
            name: userData.name,
            email: userData.email,
            role: userData.role ? String(userData.role).toLowerCase().trim() : 'student',
            password: hashedPassword // Pre-hashed
        });

        results.push({
            email: userData.email,
            password: plainPassword,
            status: 'success'
        });
        
        // Add to set to prevent duplicates within the same batch
        existingEmailsSet.add(userData.email);
    }

    if (validUsersToInsert.length > 0) {
        // bypass middleware hook using insertMany
        await User.insertMany(validUsersToInsert, { ordered: false });
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failureCount = results.filter(r => r.status === 'failed').length;
    res.json({ message: 'Bulk import processed', results, successCount, failureCount });
});

// ═══════════════════════════════════════════════════════════
// Bulk Delete Users
// ═══════════════════════════════════════════════════════════

exports.bulkDeleteUsers = asyncHandler(async (req, res) => {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        res.status(400);
        throw new Error('Please provide an array of user IDs to delete');
    }

    // Prevent admin from deleting themselves
    const filteredIds = userIds.filter(id => id.toString() !== req.user.id.toString());
    
    const result = await User.deleteMany({ _id: { $in: filteredIds } });

    res.json({ message: `${result.deletedCount} users deleted successfully` });
});

// ═══════════════════════════════════════════════════════════
// Global Settings
// ═══════════════════════════════════════════════════════════

exports.getSettings = asyncHandler(async (req, res) => {
    let setting = await Setting.findOne();
    if (!setting) {
        setting = await Setting.create({});
    }
    res.json(setting);
});

exports.saveSettings = asyncHandler(async (req, res) => {
    let setting = await Setting.findOne();
    if (setting) {
        setting.maxTabSwitches = req.body.maxTabSwitches ?? setting.maxTabSwitches;
        setting.forceFullscreen = req.body.forceFullscreen ?? setting.forceFullscreen;
        setting.allowLateSubmissions = req.body.allowLateSubmissions ?? setting.allowLateSubmissions;
        setting.enableWebcam = req.body.enableWebcam ?? setting.enableWebcam;
        setting.disableCopyPaste = req.body.disableCopyPaste ?? setting.disableCopyPaste;
        setting.requireIDVerification = req.body.requireIDVerification ?? setting.requireIDVerification;
        await setting.save();
    } else {
        setting = await Setting.create(req.body);
    }
    res.json({ message: 'Settings saved successfully', setting });
});

// ═══════════════════════════════════════════════════════════
// Candidate Identity Verification (eKYC)
// ═══════════════════════════════════════════════════════════
exports.getCandidates = asyncHandler(async (req, res) => {
    const search = req.query.search || '';
    const query = { role: 'student' };
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    const candidates = await User.find(query)
        .select('name email profilePicture idCardUrl isVerified createdAt')
        .lean();

    // Enrich with active exam session info (Only those active in the last 3 minutes)
    const studentIds = candidates.map(c => c._id);
    const LIVE_THRESHOLD = new Date(Date.now() - 3 * 60 * 1000);
    const activeSessions = await ExamSession.find({ 
        student: { $in: studentIds }, 
        status: 'in_progress',
        updatedAt: { $gte: LIVE_THRESHOLD }
    })
        .populate('exam', 'title')
        .lean();

    const sessionMap = {};
    activeSessions.forEach(s => { sessionMap[s.student.toString()] = s; });

    const enriched = candidates.map(c => ({
        ...c,
        isLive: !!sessionMap[c._id.toString()],
        currentExam: sessionMap[c._id.toString()]?.exam?.title || null
    }));

    res.json(enriched);
});

exports.verifyCandidate = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.params.userId,
        { isVerified: true },
        { new: true }
    ).select('name email isVerified');

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user });
});

exports.unverifyCandidate = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.params.userId,
        { isVerified: false },
        { new: true }
    ).select('name email isVerified');

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user });
});
