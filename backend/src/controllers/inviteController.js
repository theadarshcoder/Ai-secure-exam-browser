// ═══════════════════════════════════════════════════════════
//  📨 Invite Controller — Bulk Student Invite System
//  Handles: CSV bulk invite, token verification, invite status
//  Edge Cases: IP fix, queue flood, token rotation, session lock
// ═══════════════════════════════════════════════════════════

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Exam = require('../models/Exam');
const ExamInvite = require('../models/ExamInvite');
const { addBulkInviteJobs } = require('../queues/inviteEmailQueue');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const cacheService = require('../services/cacheService');

// ─── Helper: Generate password in vision@XXXXXX format ───
const generatePassword = () => {
    const num = Math.floor(100000 + Math.random() * 900000); // 6-digit
    return `vision@${num}`;
};

// ─── Helper: Hash a token with SHA256 ────────────────────
const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

// ─── Helper: Validate email format ───────────────────────
const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// ─── Helper: Get correct frontend URL dynamically ───────────
const getFrontendUrl = (req) => {
    const origin = req.headers.origin;
    const allowed = process.env.FRONTEND_URL?.split(',').map(u => u.trim()) || [];
    
    // If the request origin matches one of our allowed URLs, use it!
    if (origin && allowed.includes(origin)) {
        return origin;
    }
    
    // Fallback: Pick the first non-localhost URL if available
    const nonLocal = allowed.find(url => !url.includes('localhost'));
    return nonLocal || allowed[0] || 'http://localhost:5173';
};

// ═══════════════════════════════════════════════════════════
//  POST /api/exams/:examId/bulk-invite
//  Admin/Mentor uploads CSV → creates users → sends invites
// ═══════════════════════════════════════════════════════════
exports.bulkInvite = asyncHandler(async (req, res) => {
    const { examId } = req.params;
    const { students } = req.body;

    // ─── 1. Validate Exam ────────────────────────────────
    const exam = await Exam.findById(examId);
    if (!exam) {
        res.status(404);
        throw new Error('Exam not found.');
    }

    if (exam.creator.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_mentor') {
        res.status(403);
        throw new Error('You do not have permission to invite students to this exam.');
    }

    // ─── 2. Validate Input ───────────────────────────────
    if (!students || !Array.isArray(students) || students.length === 0) {
        res.status(400);
        throw new Error('Please provide a valid array of students with name and email.');
    }

    if (students.length > 500) {
        res.status(400);
        throw new Error('Maximum 500 students can be invited at once.');
    }

    // ─── 3. Deduplicate & Validate (Edge Case Fix #6) ────
    const seen = new Set();
    const validStudents = [];
    const skipped = [];

    for (const s of students) {
        const email = (s.email || '').toLowerCase().trim();
        const name = (s.name || '').trim();

        if (!email || !name) {
            skipped.push({ email: email || 'empty', reason: 'Missing name or email' });
            continue;
        }

        if (!isValidEmail(email)) {
            skipped.push({ email, reason: 'Invalid email format' });
            continue;
        }

        if (seen.has(email)) {
            skipped.push({ email, reason: 'Duplicate in CSV' });
            continue;
        }

        seen.add(email);
        validStudents.push({ name, email });
    }

    if (validStudents.length === 0) {
        res.status(400);
        throw new Error('No valid students found in the uploaded data. Check email formats and names.');
    }

    // ─── 4. Check Existing Users & Create New Ones ───────
    const emails = validStudents.map(s => s.email);
    const existingUsers = await User.find({ email: { $in: emails } }).select('_id email name');
    const existingEmailMap = new Map(existingUsers.map(u => [u.email, u]));

    // Pre-hash password with shared salt for batch performance
    const salt = await bcrypt.genSalt(10);
    const newUsersToCreate = [];
    const downloadableCredentials = [];
    const studentUserMap = new Map(); // email → { userId, isNew, password }

    for (const s of validStudents) {
        const existing = existingEmailMap.get(s.email);

        if (existing) {
            // Existing user — reuse
            studentUserMap.set(s.email, {
                userId: existing._id,
                isNew: false,
                name: existing.name
            });
            downloadableCredentials.push({
                name: existing.name,
                email: s.email,
                password: 'Already Registered',
                status: 'existing'
            });
        } else {
            // New user — create with generated password
            const plainPassword = generatePassword();
            const hashedPassword = await bcrypt.hash(plainPassword, salt);

            newUsersToCreate.push({
                name: s.name,
                email: s.email,
                password: hashedPassword,
                role: 'student',
                permissions: []
            });

            studentUserMap.set(s.email, {
                isNew: true,
                plainPassword,
                name: s.name
            });

            downloadableCredentials.push({
                name: s.name,
                email: s.email,
                password: plainPassword,
                status: 'new'
            });
        }
    }

    // Batch insert new users (bypasses pre-save middleware — password already hashed)
    if (newUsersToCreate.length > 0) {
        const insertedUsers = await User.insertMany(newUsersToCreate, { ordered: false });
        // Map inserted users back to our tracking map
        for (const user of insertedUsers) {
            const entry = studentUserMap.get(user.email);
            if (entry) {
                entry.userId = user._id;
            }
        }
    }

    // ─── 5. Check Existing Invites & Create New Ones ─────
    const existingInvites = await ExamInvite.find({
        exam: examId,
        email: { $in: emails }
    }).select('email');
    const alreadyInvitedEmails = new Set(existingInvites.map(i => i.email));

    const FRONTEND_URL = getFrontendUrl(req);
    const TOKEN_EXPIRY_HOURS = 72; // 3 days
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    const invitesToCreate = [];
    const emailJobsData = [];

    for (const s of validStudents) {
        const entry = studentUserMap.get(s.email);
        if (!entry || !entry.userId) continue;

        // Skip if already invited to this exam
        if (alreadyInvitedEmails.has(s.email)) {
            // Update credential status for already invited
            const credIdx = downloadableCredentials.findIndex(c => c.email === s.email);
            if (credIdx !== -1) {
                downloadableCredentials[credIdx].status = 'already_invited';
                if (!entry.isNew) downloadableCredentials[credIdx].password = 'Already Invited';
            }
            continue;
        }

        // Generate unique token
        const plainToken = crypto.randomBytes(32).toString('hex');
        const tokenH = hashToken(plainToken);

        invitesToCreate.push({
            exam: examId,
            student: entry.userId,
            email: s.email,
            tokenHash: tokenH,
            tokenExpiresAt: expiresAt,
            status: 'pending'
        });

        const verifyLink = `${FRONTEND_URL}/verify?token=${plainToken}`;

        emailJobsData.push({
            email: s.email,
            studentName: entry.name,
            password: entry.isNew ? entry.plainPassword : 'Use your existing password',
            examName: exam.title,
            verifyLink,
            expiresAt: expiresAt.toISOString(),
            // inviteId will be added after bulk insert
            _tempEmail: s.email
        });
    }

    // Bulk insert invites
    let createdInvites = [];
    if (invitesToCreate.length > 0) {
        createdInvites = await ExamInvite.insertMany(invitesToCreate, { ordered: false });
    }

    // Map invite IDs to email jobs
    const inviteEmailMap = new Map(createdInvites.map(inv => [inv.email, inv._id.toString()]));
    const finalEmailJobs = emailJobsData.map(job => ({
        inviteId: inviteEmailMap.get(job._tempEmail),
        email: job.email,
        studentName: job.studentName,
        password: job.password,
        examName: job.examName,
        verifyLink: job.verifyLink,
        expiresAt: job.expiresAt
    })).filter(job => job.inviteId); // Only jobs with valid invite IDs

    // ─── 6. Queue All Emails (Edge Case Fix #3: addBulk) ─
    if (finalEmailJobs.length > 0) {
        await addBulkInviteJobs(finalEmailJobs);
    }

    // ─── 7. Response ─────────────────────────────────────
    res.status(200).json({
        message: `Invite process completed! ${finalEmailJobs.length} emails queued.`,
        summary: {
            total: validStudents.length,
            newUsersCreated: newUsersToCreate.length,
            existingUsers: validStudents.length - newUsersToCreate.length,
            emailsQueued: finalEmailJobs.length,
            alreadyInvited: alreadyInvitedEmails.size,
            skipped: skipped.length
        },
        skippedRows: skipped,
        downloadableCredentials // Frontend will immediately download this as CSV & wipe from memory
    });
});


// ═══════════════════════════════════════════════════════════
//  POST /api/auth/verify-invite
//  Student clicks email link → verify token → auto-login
//  Edge Case Fix #1: No IP in fingerprint
//  Edge Case Fix #5: Tab reuse / session lock
// ═══════════════════════════════════════════════════════════
exports.verifyInvite = asyncHandler(async (req, res) => {
    const { token, deviceId } = req.body;

    // Generic error message — prevents user enumeration
    const GENERIC_ERROR = 'Invalid or expired invitation link.';

    if (!token) {
        res.status(400);
        throw new Error(GENERIC_ERROR);
    }

    // Hash the token to find the invite
    const tokenH = hashToken(token);
    const invite = await ExamInvite.findOne({ tokenHash: tokenH })
        .populate('student', '_id name email role')
        .populate('exam', '_id title');

    if (!invite) {
        res.status(403);
        throw new Error(GENERIC_ERROR);
    }

    // Check expiry
    if (invite.tokenExpiresAt < new Date()) {
        res.status(403);
        throw new Error(GENERIC_ERROR);
    }

    // Check if invite is in a valid state for verification
    if (['completed', 'failed'].includes(invite.status)) {
        res.status(403);
        throw new Error(GENERIC_ERROR);
    }

    // ─── Device Fingerprinting (Fix: Removed IP to avoid dynamic IP lockout) ──
    const userAgent = req.headers['user-agent'] || 'unknown';
    const secureFingerprint = crypto.createHash('sha256')
        .update(`${userAgent}-${deviceId || 'no-device'}`)
        .digest('hex');

    // ─── Tab Reuse / Session Lock (Fix #5) ───────────────
    if (invite.status === 'opened' || invite.status === 'exam_started') {
        if (invite.deviceFingerprint && invite.deviceFingerprint !== secureFingerprint) {
            res.status(403);
            throw new Error('This invitation is locked to another device or browser.');
        }
    }

    // Update invite status & device fingerprint
    if (invite.status === 'pending' || invite.status === 'sent') {
        invite.status = 'opened';
        invite.openedAt = new Date();
        invite.deviceFingerprint = secureFingerprint;
        await invite.save();
    }

    // ─── Generate/Reuse JWT for auto-login ────────────────
    const user = invite.student;
    if (!user) {
        res.status(403);
        throw new Error(GENERIC_ERROR);
    }

    // 🛡️ Final Unification Fix: Standardized tokens across all entry points (Login, Refresh, Invite)
    user.sessionVersion = (user.sessionVersion || 0) + 1;
    
    const refreshToken = jwt.sign(
        { id: user._id, sessionVersion: user.sessionVersion },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );

    const accessToken = jwt.sign(
        { 
            id: user._id, 
            email: user.email, 
            role: user.role, 
            sessionVersion: user.sessionVersion 
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    user.refreshToken = refreshToken;
    await user.save();

    // ⚡ SYNC TO CACHE (sessionVersion, not token)
    try {
        await cacheService.saveUserSession(user._id, user.sessionVersion, user.permissions || []);
    } catch (cacheErr) {
        console.warn('🛡️ Cache sync failed during invite (Redis down):', cacheErr.message);
    }

    console.log(`🔑 [Security] User ${user.email} logged in via invite link (Session V${user.sessionVersion})`);

    res.json({
        message: 'Invitation verified! Redirecting to exam...',
        accessToken, 
        refreshToken, 
        examId: invite.exam._id,
        examTitle: invite.exam.title,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role || 'student'
        }
    });
});


// ═══════════════════════════════════════════════════════════
//  GET /api/exams/:examId/invites
//  Admin/Mentor views invite status for an exam
// ═══════════════════════════════════════════════════════════
exports.getInviteStatus = asyncHandler(async (req, res) => {
    const { examId } = req.params;

    const exam = await Exam.findById(examId);
    if (!exam) {
        res.status(404);
        throw new Error('Exam not found.');
    }

    if (exam.creator.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_mentor') {
        res.status(403);
        throw new Error('You do not have permission to view invites for this exam.');
    }

    const invites = await ExamInvite.find({ exam: examId })
        .populate('student', 'name email')
        .sort({ createdAt: -1 })
        .lean();

    const summary = {
        total: invites.length,
        pending: invites.filter(i => i.status === 'pending').length,
        sent: invites.filter(i => i.status === 'sent').length,
        opened: invites.filter(i => i.status === 'opened').length,
        exam_started: invites.filter(i => i.status === 'exam_started').length,
        completed: invites.filter(i => i.status === 'completed').length,
        failed: invites.filter(i => i.status === 'failed').length
    };

    res.json({ invites, summary });
});


// ═══════════════════════════════════════════════════════════
//  POST /api/exams/:examId/resend-invite
//  Resend invite with NEW token (Edge Case Fix #4: Token Rotation)
// ═══════════════════════════════════════════════════════════
exports.resendInvite = asyncHandler(async (req, res) => {
    const { examId } = req.params;
    const { email } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) {
        res.status(404);
        throw new Error('Exam not found.');
    }

    if (exam.creator.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_mentor') {
        res.status(403);
        throw new Error('Permission denied.');
    }

    const invite = await ExamInvite.findOne({ exam: examId, email: email.toLowerCase().trim() });
    if (!invite) {
        res.status(404);
        throw new Error('No invite found for this email.');
    }

    // Cannot resend if already started/completed
    if (['exam_started', 'completed'].includes(invite.status)) {
        res.status(400);
        throw new Error('Cannot resend invite — student has already accessed the exam.');
    }

    // ─── Token Rotation: Generate NEW token, invalidate old one ───
    const FRONTEND_URL = getFrontendUrl(req);
    const TOKEN_EXPIRY_HOURS = 72;
    const newPlainToken = crypto.randomBytes(32).toString('hex');
    const newTokenHash = hashToken(newPlainToken);
    const newExpiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    invite.tokenHash = newTokenHash;
    invite.tokenExpiresAt = newExpiresAt;
    invite.status = 'pending';
    invite.deviceFingerprint = null; // Reset device lock
    invite.resendCount += 1;
    await invite.save();

    const verifyLink = `${FRONTEND_URL}/verify?token=${newPlainToken}`;

    // Get user info for email
    const student = await User.findById(invite.student).select('name');

    // Queue new email
    await addBulkInviteJobs([{
        inviteId: invite._id.toString(),
        email: invite.email,
        studentName: student?.name || 'Student',
        password: 'Use your existing password',
        examName: exam.title,
        verifyLink,
        expiresAt: newExpiresAt.toISOString()
    }]);

    res.json({
        message: `Invite resent to ${invite.email} with a new link.`,
        resendCount: invite.resendCount
    });
});
