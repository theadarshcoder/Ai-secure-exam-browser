// ─────────────────────────────────────────────────────────
// sessionController.js — Exam Session & Violation Management
// ─────────────────────────────────────────────────────────
// This controller handles two main tasks:
//   1. Saving violations (cheating attempts) to MongoDB
//   2. Displaying violation history of students to Admins/Mentors

const ExamSession = require('../models/ExamSession');
const User = require('../models/User');


// ═══════════════════════════════════════════════════════════
//  🚨 POST /api/session/violation
// ═══════════════════════════════════════════════════════════
// Triggered when a student performs a restricted action (tab switch, copy-paste, face not detected, etc.)
// The frontend calls this API to log the violation in MongoDB.
//
// 📦 Request Body:
// {
//   "examId": "665abc123...",           ← target exam
//   "type": "Tab Switch",               ← violation type
//   "severity": "medium",               ← low / medium / high / critical
//   "details": "Student switched to Chrome"  ← additional information (optional)
// }
//
// 📤 Response:
// {
//   "message": "Violation logged!",
//   "violationCount": 5,                ← total violations for this session
//   "tabSwitches": 3,                   ← specifically tab switch count
//   "warningLevel": "moderate"          ← calculated overall warning level
// }

exports.logViolation = async (req, res) => {
    try {
        const { examId, type, severity, details } = req.body;
        const studentId = req.user.id;

        // Step 1: Validate required fields
        if (!examId || !type) {
            return res.status(400).json({ 
                error: 'Both examId and violation type are required!' 
            });
        }

        // Step 2: Construct violation object
        const violation = {
            type: type,                          // e.g., "Tab Switch", "Copy Paste", "Face Not Detected"
            severity: severity || 'medium',      // Defaults to medium
            details: details || '',              
            timestamp: new Date()                
        };

        // Step 3: Define update operations
        const update = {
            $push: { violations: violation },    // Append to violations array
            $set: { lastSavedAt: new Date() }    // Update activity timestamp
        };

        // Step 4: Increment tab switch counter if applicable
        // This allows quick monitoring in the mentor dashboard without processing the full array.
        if (type === 'Tab Switch') {
            update.$inc = { tabSwitchCount: 1 };
        }

        // Step 5: Find and update the corresponding session
        const session = await ExamSession.findOneAndUpdate(
            { exam: examId, student: studentId },
            update,
            { new: true }   // Return the modified document
        );

        if (!session) {
            return res.status(404).json({ 
                error: 'Exam session not found. Was the exam started?' 
            });
        }

        // Step 6: Calculate current warning level based on violation count
        const totalViolations = session.violations.length;
        let warningLevel = 'clean';          // 0 violations
        if (totalViolations >= 1)  warningLevel = 'minor';      // 1-2 violations
        if (totalViolations >= 3)  warningLevel = 'moderate';    // 3-5 violations  
        if (totalViolations >= 6)  warningLevel = 'serious';     // 6-9 violations
        if (totalViolations >= 10) warningLevel = 'critical';    // 10+ leads to near-termination

        // Step 7: Send response
        res.json({ 
            message: 'Violation logged!',
            violationCount: totalViolations,
            tabSwitches: session.tabSwitchCount,
            warningLevel,
            latestViolation: {
                type: violation.type,
                severity: violation.severity,
                timestamp: violation.timestamp
            }
        });

    } catch (error) {
        console.error('🚨 Violation logging failed:', error);
        res.status(500).json({ error: 'Failed to log violation' });
    }
};


// ═══════════════════════════════════════════════════════════
//  📋 GET /api/session/violations/:examId/:studentId
// ═══════════════════════════════════════════════════════════
// Allows Admins/Mentors to review the violation history of a specific student.
// Provides a detailed breakdown of cheating attempts during an exam.
//
// 📤 Response:
// {
//   "studentName": "Rahul Kumar",
//   "examTitle": "DSA Final Exam",
//   "totalViolations": 10,
//   "tabSwitches": 5,
//   "warningLevel": "critical",
//   "violations": [ { type, severity, details, timestamp }, ... ],
//   "summary": { "Tab Switch": 5, "Copy Paste": 3, "Face Not Detected": 2 }
// }

exports.getViolationHistory = async (req, res) => {
    try {
        const { examId, studentId } = req.params;

        // Retrieve session with associated metadata
        const session = await ExamSession.findOne({ exam: examId, student: studentId })
            .populate('student', 'name email')
            .populate('exam', 'title category duration');

        if (!session) {
            return res.status(404).json({ error: 'No session found for this student.' });
        }

        // ─── Generate Violation Type Summary ─────────
        const summary = {};
        session.violations.forEach(v => {
            summary[v.type] = (summary[v.type] || 0) + 1;
        });

        // ─── Generate Severity Breakdown ────────────
        const severityBreakdown = {};
        session.violations.forEach(v => {
            severityBreakdown[v.severity] = (severityBreakdown[v.severity] || 0) + 1;
        });

        // ─── Calculate Warning Level ─────────────────
        const totalViolations = session.violations.length;
        let warningLevel = 'clean';
        if (totalViolations >= 1)  warningLevel = 'minor';
        if (totalViolations >= 3)  warningLevel = 'moderate';
        if (totalViolations >= 6)  warningLevel = 'serious';
        if (totalViolations >= 10) warningLevel = 'critical';

        res.json({
            studentName: session.student?.name || 'Unknown',
            studentEmail: session.student?.email || '',
            examTitle: session.exam?.title || 'Unknown Exam',
            examCategory: session.exam?.category || '',
            
            // Numerical Counts
            totalViolations,
            tabSwitches: session.tabSwitchCount,
            warningLevel,

            // Detailed Datasets
            violations: session.violations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),  // Newest first
            summary,               // Count grouped by type
            severityBreakdown,     // Count grouped by severity

            // Session Metadata
            sessionStatus: session.status,
            startedAt: session.startedAt,
            submittedAt: session.submittedAt,
            resumeCount: session.resumeCount
        });

    } catch (error) {
        console.error('Failed to fetch violation history:', error);
        res.status(500).json({ error: 'Failed to fetch violations' });
    }
};


// ═══════════════════════════════════════════════════════════
//  📊 GET /api/session/flagged/:examId
// ═══════════════════════════════════════════════════════════
// Retrieves a list of all flagged (suspicious) students for a specific exam.
// Used in the dashboard to highlight students with critical risks.

exports.getFlaggedStudents = async (req, res) => {
    try {
        const { examId } = req.params;

        // Filter sessions that have at least one recorded violation
        const sessions = await ExamSession.find({ 
            exam: examId,
            'violations.0': { $exists: true }   
        })
            .populate('student', 'name email')
            .sort({ tabSwitchCount: -1 });       // Prioritize higher violation counts

        const flaggedStudents = sessions.map(s => {
            const totalViolations = s.violations.length;
            let riskLevel = 'Low';
            if (totalViolations >= 3)  riskLevel = 'Medium';
            if (totalViolations >= 6)  riskLevel = 'High';
            if (totalViolations >= 10) riskLevel = 'Critical';

            // Group violations by type
            const types = {};
            s.violations.forEach(v => { types[v.type] = (types[v.type] || 0) + 1; });

            return {
                studentId: s.student?._id,
                studentName: s.student?.name || 'Unknown',
                studentEmail: s.student?.email || '',
                totalViolations,
                tabSwitches: s.tabSwitchCount,
                riskLevel,
                riskScore: Math.max(0, 100 - (totalViolations * 10)),  // Base 100, -10 per violation
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

    } catch (error) {
        console.error('Failed to fetch flagged students:', error);
        res.status(500).json({ error: 'Failed to fetch flagged students' });
    }
};
