const ExamSession = require('../models/ExamSession');
const User = require('../models/User');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { getRiskInfo } = require('../utils/helpers');


// ═══════════════════════════════════════════════════════════
//  🚨 POST /api/session/violation
// ═══════════════════════════════════════════════════════════
exports.logViolation = asyncHandler(async (req, res) => {
    const { examId, type, severity, details } = req.body;
    const studentId = req.user.id;

    if (!examId || !type) {
        res.status(400);
        throw new Error('Both examId and violation type are required!');
    }

    const update = {
        $push: { 
            violations: {
                type,
                severity: severity || 'medium',
                details: details || '',
                timestamp: new Date()
            }
        },
        $set: { lastSavedAt: new Date() }
    };

    if (type === 'Tab Switch' || type === 'TAB_HIDDEN') {
        update.$inc = { tabSwitchCount: 1 };
    }

    const session = await ExamSession.findOneAndUpdate(
        { exam: examId, student: studentId },
        update,
        { new: true }
    );

    if (!session) {
        res.status(404);
        throw new Error('Exam session not found. Was the exam started?');
    }

    const { level } = getRiskInfo(session.violations.length);

    res.json({ 
        message: 'Violation logged!',
        violationCount: session.violations.length,
        tabSwitches: session.tabSwitchCount,
        warningLevel: level,
        latestViolation: session.violations[session.violations.length - 1]
    });
});


// ═══════════════════════════════════════════════════════════
//  📋 GET /api/session/violations/:examId/:studentId
// ═══════════════════════════════════════════════════════════
exports.getViolationHistory = asyncHandler(async (req, res) => {
    const { examId, studentId } = req.params;

    const session = await ExamSession.findOne({ exam: examId, student: studentId })
        .populate('student', 'name email')
        .populate('exam', 'title category duration');

    if (!session) {
        res.status(404);
        throw new Error('No session found for this student.');
    }

    const summary = {};
    const severityBreakdown = {};
    session.violations.forEach(v => {
        summary[v.type] = (summary[v.type] || 0) + 1;
        severityBreakdown[v.severity] = (severityBreakdown[v.severity] || 0) + 1;
    });

    const { level } = getRiskInfo(session.violations.length);

    res.json({
        studentName: session.student?.name || 'Unknown',
        studentEmail: session.student?.email || '',
        examTitle: session.exam?.title || 'Unknown Exam',
        examCategory: session.exam?.category || '',
        totalViolations: session.violations.length,
        tabSwitches: session.tabSwitchCount,
        warningLevel: level,
        violations: session.violations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
        summary,
        severityBreakdown,
        sessionStatus: session.status,
        startedAt: session.startedAt,
        submittedAt: session.submittedAt,
        resumeCount: session.resumeCount
    });
});


// ═══════════════════════════════════════════════════════════
//  📊 GET /api/session/flagged/:examId
// ═══════════════════════════════════════════════════════════
exports.getFlaggedStudents = asyncHandler(async (req, res) => {
    const { examId } = req.params;

    const sessions = await ExamSession.find({ 
        exam: examId,
        'violations.0': { $exists: true }   
    })
        .populate('student', 'name email')
        .sort({ tabSwitchCount: -1 });

    const flaggedStudents = sessions.map(s => {
        const { risk, score } = getRiskInfo(s.violations.length);
        const types = {};
        s.violations.forEach(v => { types[v.type] = (types[v.type] || 0) + 1; });

        return {
            studentId: s.student?._id,
            studentName: s.student?.name || 'Unknown',
            studentEmail: s.student?.email || '',
            totalViolations: s.violations.length,
            tabSwitches: s.tabSwitchCount,
            riskLevel: risk,
            riskScore: score,
            violationTypes: types,
            lastViolation: s.violations[s.violations.length - 1]?.timestamp,
            sessionStatus: s.status
        };
    });

    res.json({
        examId,
        totalFlagged: flaggedStudents.length,
        students: flaggedStudents
    });
});
