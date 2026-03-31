// ─────────────────────────────────────────────────────────
// sessionController.js — Exam Session & Violation Management
// ─────────────────────────────────────────────────────────
// Ye controller 2 kaam karta hai:
//   1. Violations (cheating attempts) ko MongoDB mein save karna
//   2. Admin/Mentor ko kisi bhi student ka violation history dikhana

const ExamSession = require('../models/ExamSession');
const User = require('../models/User');


// ═══════════════════════════════════════════════════════════
//  🚨 POST /api/session/violation
// ═══════════════════════════════════════════════════════════
// Jab bhi student koi cheating kare (tab switch, copy-paste, face not detected, etc.)
// Frontend ye API call karega aur violation MongoDB mein save ho jayega
//
// 📦 Request Body:
// {
//   "examId": "665abc123...",           ← kis exam mein hua
//   "type": "Tab Switch",               ← violation ka type
//   "severity": "medium",               ← low / medium / high / critical
//   "details": "Student switched to Chrome"  ← extra info (optional)
// }
//
// 📤 Response:
// {
//   "message": "Violation logged!",
//   "violationCount": 5,                ← ab tak total kitne violations hue
//   "tabSwitches": 3,                   ← tab switch count
//   "warningLevel": "moderate"          ← overall warning level
// }

exports.logViolation = async (req, res) => {
    try {
        const { examId, type, severity, details } = req.body;
        const studentId = req.user.id;

        // Step 1: Validate — examId aur type toh chahiye hi
        if (!examId || !type) {
            return res.status(400).json({ 
                error: 'examId aur violation type dono required hain!' 
            });
        }

        // Step 2: Violation object banao
        const violation = {
            type: type,                          // "Tab Switch", "Copy Paste", "Face Not Detected", etc.
            severity: severity || 'medium',      // Default severity = medium
            details: details || '',              // Extra info (optional)
            timestamp: new Date()                // Kab hua
        };

        // Step 3: Update object banao
        const update = {
            $push: { violations: violation },    // Violations array mein add karo
            $set: { lastSavedAt: new Date() }    // Last activity timestamp
        };

        // Step 4: Agar Tab Switch hai toh counter bhi badhao
        // Ye alag counter isliye rakhte hain taaki mentor dashboard mein
        // quickly "10 tab switches" dikha sake bina violations array count kiye
        if (type === 'Tab Switch') {
            update.$inc = { tabSwitchCount: 1 };
        }

        // Step 5: Session dhundo aur update karo
        const session = await ExamSession.findOneAndUpdate(
            { exam: examId, student: studentId },
            update,
            { new: true }   // Updated document return karo
        );

        if (!session) {
            return res.status(404).json({ 
                error: 'Exam session nahi mili. Kya exam start hua tha?' 
            });
        }

        // Step 6: Warning level calculate karo (violations ki count ke basis pe)
        const totalViolations = session.violations.length;
        let warningLevel = 'clean';          // 0 violations
        if (totalViolations >= 1)  warningLevel = 'minor';      // 1-2 violations
        if (totalViolations >= 3)  warningLevel = 'moderate';    // 3-5 violations  
        if (totalViolations >= 6)  warningLevel = 'serious';     // 6-9 violations
        if (totalViolations >= 10) warningLevel = 'critical';    // 10+ = almost auto-terminate

        // Step 7: Response bhejo
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
// Admin/Mentor kisi specific student ka violation history dekh sakta hai
// Example: "Is bacche ne 10 baar tab switch ki, 3 baar copy paste kiya"
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

        // Session dhundo with populated references
        const session = await ExamSession.findOne({ exam: examId, student: studentId })
            .populate('student', 'name email')
            .populate('exam', 'title category duration');

        if (!session) {
            return res.status(404).json({ error: 'Is student ki koi session nahi mili.' });
        }

        // ─── Violation Summary Banao ─────────────────
        // { "Tab Switch": 5, "Copy Paste": 3, "Face Not Detected": 2 }
        const summary = {};
        session.violations.forEach(v => {
            summary[v.type] = (summary[v.type] || 0) + 1;
        });

        // ─── Severity Breakdown ──────────────────────
        // { "low": 2, "medium": 5, "high": 2, "critical": 1 }
        const severityBreakdown = {};
        session.violations.forEach(v => {
            severityBreakdown[v.severity] = (severityBreakdown[v.severity] || 0) + 1;
        });

        // ─── Warning Level ───────────────────────────
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
            
            // Counts
            totalViolations,
            tabSwitches: session.tabSwitchCount,
            warningLevel,

            // Detailed data
            violations: session.violations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),  // Latest pehle
            summary,               // Type-wise count
            severityBreakdown,     // Severity-wise count

            // Session info
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
// Mentor/Admin ko ek exam ke saare flagged (suspicious) students dikhao
// Dashboard pe red flags ke saath

exports.getFlaggedStudents = async (req, res) => {
    try {
        const { examId } = req.params;

        // Sirf wo sessions dhundo jinme violations hain
        const sessions = await ExamSession.find({ 
            exam: examId,
            'violations.0': { $exists: true }   // At least 1 violation ho
        })
            .populate('student', 'name email')
            .sort({ tabSwitchCount: -1 });       // Sabse zyada violations wale pehle

        const flaggedStudents = sessions.map(s => {
            const totalViolations = s.violations.length;
            let riskLevel = 'Low';
            if (totalViolations >= 3)  riskLevel = 'Medium';
            if (totalViolations >= 6)  riskLevel = 'High';
            if (totalViolations >= 10) riskLevel = 'Critical';

            // Type-wise summary
            const types = {};
            s.violations.forEach(v => { types[v.type] = (types[v.type] || 0) + 1; });

            return {
                studentId: s.student?._id,
                studentName: s.student?.name || 'Unknown',
                studentEmail: s.student?.email || '',
                totalViolations,
                tabSwitches: s.tabSwitchCount,
                riskLevel,
                riskScore: Math.max(0, 100 - (totalViolations * 10)),  // 100 se shuru, har violation pe -10
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
