const Institution = require('../models/Institution');
const User = require('../models/User');
const DemoRequest = require('../models/DemoRequest');
const AuditLog = require('../models/AuditLog');
const InstitutionSettings = require('../models/InstitutionSettings'); 
const Exam = require('../models/Exam');
const ExamSession = require('../models/ExamSession');
const ExamAnswer = require('../models/ExamAnswer');
const ExamInvite = require('../models/ExamInvite');
const InstitutionUsage = require('../models/InstitutionUsage');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const UpgradeRequest = require('../models/UpgradeRequest');

const mongoose = require('mongoose');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { getRedisClient } = require('../config/redis');
const { sendAccessApprovedEmail, sendPasswordResetEmail } = require('../services/emailService');
const { clearCache } = require('../services/cacheService');

/**
 * 📈 Get Platform-wide Statistics (Cached)
 */
exports.getPlatformStats = asyncHandler(async (req, res) => {
    const redis = getRedisClient();
    const CACHE_KEY = 'platform:stats:v2';

    try {
        const cachedStats = await redis.get(CACHE_KEY);
        if (cachedStats) {
            return res.json(JSON.parse(cachedStats));
        }

        const [totalInstitutions, activeTenants, totalUsers, totalExams, pendingDemos] = await Promise.all([
            Institution.countDocuments(),
            Institution.countDocuments({ status: { $ne: 'suspended' } }),
            User.countDocuments(),
            Exam.countDocuments().catch(() => 0),
            DemoRequest.countDocuments({ status: 'pending' })
        ]);

        const stats = {
            totalInstitutions,
            activeTenants,
            totalUsers,
            totalExams,
            pendingDemos,
            uptime: process.uptime(),
            timestamp: new Date()
        };

        await redis.set(CACHE_KEY, JSON.stringify(stats), 'EX', 600);
        res.json(stats);
    } catch (error) {
        console.error('Stats aggregation failed:', error);
        res.json({ totalInstitutions: 0, activeTenants: 0, totalStudents: 0, totalExams: 0, pendingDemos: 0, uptime: process.uptime() });
    }
});

/**
 * 📬 Get all demo requests
 */
exports.getDemoRequests = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 20;
    limit = Math.min(limit, 100);
    const skip = (page - 1) * limit;

    const requests = await DemoRequest.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const total = await DemoRequest.countDocuments();

    res.json({
        requests,
        total,
        page,
        pages: Math.ceil(total / limit)
    });
});

/**
 * ✅ Approve Demo Request (Hardened Onboarding)
 */
exports.approveDemoRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const demoReq = await DemoRequest.findById(id).session(session);
        if (!demoReq) throw new Error('Demo request not found');
        if (demoReq.status !== 'pending') throw new Error('Demo request is already processed');

        // 🛡️ Pre-Transaction Collision Checks
        const [existingUser, existingDomain] = await Promise.all([
            User.findOne({ email: demoReq.email.toLowerCase() }),
            Institution.findOne({ domain: (demoReq.website || `${demoReq.institutionName.replace(/\s+/g, '').toLowerCase()}.edu`).toLowerCase() })
        ]);

        if (existingUser) throw new Error(`An account with email ${demoReq.email} already exists.`);
        if (existingDomain) throw new Error(`The domain for ${demoReq.institutionName} is already registered.`);

        // Create Institution
        const institution = new Institution({
            name: demoReq.institutionName,
            code: demoReq.institutionName.replace(/\s+/g, '').substring(0, 10).toUpperCase() + Math.floor(1000 + Math.random() * 9000),
            domain: demoReq.website || `${demoReq.institutionName.replace(/\s+/g, '').toLowerCase()}.edu`,
            plan: 'trial',
            maxStudents: 100,
            maxMentors: 5,
            createdBy: req.user.id
        });
        await institution.save({ session });

        // Generate simple default password format: vision + 4 random digits
        const randomPassword = "vision" + Math.floor(1000 + Math.random() * 9000);

        const adminUser = new User({
            name: demoReq.name,
            email: demoReq.email.toLowerCase(),
            password: randomPassword,
            role: 'admin',
            status: 'invited', // 🛡️ Status is invited until first login
            institutionId: institution._id
        });
        await adminUser.save({ session });

        // Create Institution Settings (with platform defaults)
        const settings = new InstitutionSettings({
            institutionId: institution._id
        });
        await settings.save({ session });

        // Audit Log
        await AuditLog.create([{
            performedBy: req.user.id,
            action: 'APPROVE_DEMO',
            severity: 'info',
            targetUserId: adminUser._id,
            institutionId: institution._id,
            actorRole: 'super_admin',
            details: { demoRequestId: id, institutionName: institution.name }
        }], { session });

        demoReq.status = 'approved';
        await demoReq.save({ session });

        await session.commitTransaction();
        session.endSession();

        // 🚀 Send Welcome Email to the new Admin (Async)
        sendAccessApprovedEmail({
            to: adminUser.email,
            name: adminUser.name,
            institutionName: institution.name,
            password: randomPassword,
            institutionCode: institution.code
        }).catch(err => {
            console.error('Failed to send onboarding email:', err);
        });

        res.json({
            message: 'Institution created successfully',
            institution,
            adminEmail: adminUser.email,
            adminPassword: randomPassword
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ message: error.message });
    }
});

/**
 * ❌ Reject Demo Request
 */
exports.rejectDemoRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const demoReq = await DemoRequest.findById(id);
    if (!demoReq) throw new Error('Demo request not found');
    
    demoReq.status = 'rejected';
    await demoReq.save();
    
    res.json({ message: 'Demo request rejected' });
});

/**
 * 🏢 Get all institutions
 */
exports.getInstitutions = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 20;
    limit = Math.min(limit, 100);
    const skip = (page - 1) * limit;

    const institutions = await Institution.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const total = await Institution.countDocuments();

    res.json({
        institutions,
        total,
        page,
        pages: Math.ceil(total / limit)
    });
});

/**
 * 🔍 Get single institution details
 */
exports.getInstitutionDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const institution = await Institution.findById(id);
    if (!institution) throw new Error('Institution not found');

    const [admins, settings, studentCount, mentorCount, examCount] = await Promise.all([
        User.find({ institutionId: id, role: 'admin' }).select('-password'),
        InstitutionSettings.findOne({ institutionId: id }),
        User.countDocuments({ institutionId: id, role: 'student' }),
        User.countDocuments({ institutionId: id, role: 'mentor' }),
        Exam.countDocuments({ institutionId: id })
    ]);

    res.json({ 
        institution, 
        admins, 
        settings,
        usage: {
            students: studentCount,
            mentors: mentorCount,
            exams: examCount
        }
    });
});

/**
 * ⚖️ Advanced Institution Status Management
 * Super Admin manually overrides institution lifecycle state
 */
exports.updateInstitutionStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    const validStatuses = [
        'active', 
        'suspended', 
        'maintenance', 
        'trial_expired', 
        'payment_failed', 
        'grace_period'
    ];

    if (!validStatuses.includes(status)) {
        res.status(400);
        throw new Error(`Invalid status. Allowed: ${validStatuses.join(', ')}`);
    }

    const institution = await Institution.findById(id);
    if (!institution) {
        res.status(404);
        throw new Error('Institution not found');
    }

    const oldStatus = institution.status;
    institution.status = status;
    institution.statusUpdatedAt = new Date();

    if (status === 'suspended') {
        institution.suspendedAt = new Date();
        institution.suspendedBy = req.user.id;
        institution.suspensionReason = reason || 'Manual suspension by Super Admin';
    } else {
        // Reset suspension metadata if reactivated
        institution.suspendedAt = undefined;
        institution.suspendedBy = undefined;
        institution.suspensionReason = undefined;
    }

    await institution.save();

    // ⚡ CRITICAL: Clear cache so middleware picks up new status immediately
    await clearCache(`inst_access:${id}`);
    await clearCache(`admin_dashboard_stats_${id}`);

    // Audit Log
    await AuditLog.create({
        performedBy: req.user.id,
        action: `INSTITUTION_STATUS_CHANGE`,
        severity: (status === 'suspended' || status === 'trial_expired') ? 'critical' : 'info',
        institutionId: id,
        actorRole: 'super_admin',
        details: { 
            oldStatus, 
            newStatus: status, 
            reason: reason || 'Status updated by system administrator' 
        }
    });

    res.json({ 
        message: `Institution status updated from ${oldStatus} to ${status}`, 
        institution 
    });
});

/**
 * 🔑 Reset admin password
 */
exports.resetAdminPassword = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { adminId, password } = req.body;

    const user = await User.findById(adminId);
    if (!user || user.institutionId.toString() !== id) throw new Error('Admin not found in this institution');

    // Use manually provided password, or generate a default one
    const newPassword = password || ("vision" + Math.floor(1000 + Math.random() * 9000));
    user.password = newPassword;
    await user.save();

    // Audit Log
    await AuditLog.create({
        performedBy: req.user.id,
        action: 'RESET_ADMIN_PASSWORD',
        severity: 'warning',
        targetUserId: adminId,
        institutionId: id,
        actorRole: 'super_admin',
        details: { adminEmail: user.email }
    });

    // Send Password Reset Email (Async)
    const institution = await Institution.findById(id);
    sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        institutionName: institution ? institution.name : 'Your Institution',
        password: newPassword
    }).catch(err => {
        console.error('Failed to send password reset email:', err);
    });

    res.json({ message: `Admin password reset successfully`, newPassword });
});

/**
 * 📜 Get Institution Activity Timeline
 */
exports.getInstitutionTimeline = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const logs = await AuditLog.find({ institutionId: id })
        .sort({ createdAt: -1 })
        .populate('performedBy', 'name email')
        .limit(50);
        
    res.json(logs);
});

/**
 * 📜 Get global logs
 */
exports.getGlobalLogs = asyncHandler(async (req, res) => {
    const logs = await AuditLog.find()
        .sort({ createdAt: -1 })
        .populate('performedBy', 'name email')
        .populate('institutionId', 'name')
        .limit(100);
    res.json(logs);
});

/**
 * 🔐 Add New Admin to Existing Institution
 */
exports.addInstitutionAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;

    if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
    }

    const institution = await Institution.findById(id);
    if (!institution) {
        return res.status(404).json({ message: 'Institution not found' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Generate simple secure password
    const randomPassword = "vision" + Math.floor(100000 + Math.random() * 900000);

    const newAdmin = await User.create({
        name,
        email,
        password: randomPassword,
        role: 'admin',
        institutionId: id,
        permissions: ['MANAGE_USERS', 'MANAGE_EXAMS', 'VIEW_REPORTS', 'MANAGE_SETTINGS']
    });

    // Send Welcome Email
    sendAccessApprovedEmail({
        to: newAdmin.email,
        name: newAdmin.name,
        institutionName: institution.name,
        password: randomPassword,
        institutionCode: institution.code
    }).catch(err => {
        console.error('Failed to send admin email:', err);
    });

    await AuditLog.create({
        action: 'ADD_INSTITUTION_ADMIN',
        performedBy: req.user.id,
        institutionId: id,
        severity: 'info',
        details: { newAdminId: newAdmin._id, email: newAdmin.email }
    });

    res.json({ message: 'Admin added successfully', adminId: newAdmin._id, tempPassword: randomPassword });
});

const PLANS = require('../config/plans');

/**
 * 📊 Update Institution Usage Limits (Upgrade License)
 */
exports.updateInstitutionLimits = asyncHandler(async (req, res) => {
    const { id } = req.params;
    let { maxStudents, maxMentors, maxExams, plan } = req.body;

    const institution = await Institution.findById(id);
    if (!institution) {
        res.status(404);
        throw new Error('Institution not found');
    }

    const oldLimits = { 
        maxStudents: institution.maxStudents, 
        maxMentors: institution.maxMentors, 
        maxExams: institution.maxExams,
        plan: institution.plan 
    };

    // 🔄 Auto-apply plan defaults if plan is changed and limits are not explicitly provided
    if (plan && plan !== institution.plan) {
        const planConfig = PLANS[plan.toUpperCase()];
        if (planConfig) {
            maxStudents = maxStudents || planConfig.limits.maxStudents;
            maxMentors = maxMentors || planConfig.limits.maxMentors;
            maxExams = maxExams || planConfig.limits.maxExams;
        }
    }

    if (maxStudents) institution.maxStudents = maxStudents;
    if (maxMentors) institution.maxMentors = maxMentors;
    if (maxExams) institution.maxExams = maxExams;
    if (plan) institution.plan = plan;

    await institution.save();

    // 🛡️ Clear cache for this institution so the admin sees the update immediately
    await clearCache(`admin_dashboard_stats_${id}`);

    // Audit Log
    await AuditLog.create({
        performedBy: req.user.id,
        action: 'UPDATE_INSTITUTION_LIMITS',
        severity: 'warning',
        institutionId: id,
        actorRole: 'super_admin',
        details: { oldLimits, newLimits: { maxStudents, maxMentors, maxExams, plan } }
    });

    res.json({ message: 'Institution limits updated successfully', institution });
});

/**
 * 🗑️ Hard Delete Institution (Cascaded Cleanup)
 * Super Admin manually wipes an institution and all its data.
 * This is IRREVERSIBLE and frees up emails for re-registration.
 */
exports.deleteInstitution = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const institution = await Institution.findById(id).session(session);
        if (!institution) {
            res.status(404);
            throw new Error('Institution not found');
        }

        // 1. Identify all users and sessions for cleanup
        const userIds = await User.find({ institutionId: id }).session(session).distinct('_id');
        const sessionIds = await ExamSession.find({ institutionId: id }).session(session).distinct('_id');

        // 2. Delete Exam-related data
        await ExamAnswer.deleteMany({ sessionId: { $in: sessionIds } }).session(session);
        await ExamSession.deleteMany({ institutionId: id }).session(session);
        await ExamInvite.deleteMany({ institutionId: id }).session(session);
        await Exam.deleteMany({ institutionId: id }).session(session);

        // 3. Delete Billing & Subscription data
        await Subscription.deleteMany({ institutionId: id }).session(session);
        await Invoice.deleteMany({ institutionId: id }).session(session);
        await UpgradeRequest.deleteMany({ institutionId: id }).session(session);
        await InstitutionUsage.deleteMany({ institutionId: id }).session(session);

        // 4. Delete Infrastructure data
        await InstitutionSettings.deleteMany({ institutionId: id }).session(session);
        await AuditLog.deleteMany({ institutionId: id }).session(session);

        // 5. Delete all Users associated with this institution
        // This is what frees up the email addresses
        await User.deleteMany({ institutionId: id }).session(session);

        // 6. Finally, delete the Institution itself
        await Institution.findByIdAndDelete(id).session(session);

        // 7. Clear Caches
        await clearCache(`inst_access:${id}`);
        await clearCache(`admin_dashboard_stats_${id}`);

        await session.commitTransaction();
        session.endSession();

        res.json({ 
            success: true,
            message: `Institution '${institution.name}' and all associated data have been permanently deleted.` 
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Institution deletion failed:', error);
        res.status(400).json({ 
            success: false, 
            message: error.message || 'Failed to delete institution' 
        });
    }
});

/**
 * 💎 Get all Upgrade Requests
 */
exports.getUpgradeRequests = asyncHandler(async (req, res) => {
    const requests = await UpgradeRequest.find()
        .populate('institutionId', 'name domain code')
        .populate('requestedBy', 'name email')
        .sort({ createdAt: -1 });

    res.json(requests);
});

/**
 * ✅ Process Upgrade Request (Approve/Reject)
 */
exports.processUpgradeRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
        throw new Error('Invalid status. Use approved or rejected.');
    }

    const request = await UpgradeRequest.findById(id);
    if (!request) throw new Error('Upgrade request not found');
    if (request.status !== 'pending') throw new Error('Request already processed');

    request.status = status;
    request.notes = notes;
    request.processedAt = new Date();
    request.processedBy = req.user.id;
    await request.save();

    if (status === 'approved') {
        const institution = await Institution.findById(request.institutionId);
        if (institution) {
            institution.plan = request.plan;
            
            // Auto-update limits based on plan
            const planConfig = PLANS[request.plan.toUpperCase()];
            if (planConfig) {
                institution.maxStudents = planConfig.limits.maxStudents;
                institution.maxMentors = planConfig.limits.maxMentors;
                institution.maxExams = planConfig.limits.maxExams;
            }
            
            await institution.save();
            await clearCache(`admin_dashboard_stats_${request.institutionId}`);
            
            // Audit Log
            await AuditLog.create({
                performedBy: req.user.id,
                action: 'UPGRADE_PLAN_APPROVED',
                severity: 'info',
                institutionId: request.institutionId,
                actorRole: 'super_admin',
                details: { plan: request.plan, requestId: id }
            });
        }
    }

    res.json({ message: `Request ${status} successfully`, request });
});

/**
 * 🗑️ Delete Demo Request
 */
exports.deleteDemoRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await DemoRequest.findByIdAndDelete(id);
    res.json({ success: true, message: 'Demo request deleted' });
});

/**
 * 🗑️ Delete Upgrade Request
 */
exports.deleteUpgradeRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await UpgradeRequest.findByIdAndDelete(id);
    res.json({ success: true, message: 'Upgrade request deleted' });
});

/**
 * 🧠 Get Platform Intelligence Data
 */
exports.getIntelligenceData = asyncHandler(async (req, res) => {
    // 1. Top Institutions by Activity (Exam Count)
    const topInstitutions = await Exam.aggregate([
        { $group: { _id: '$institutionId', examCount: { $sum: 1 } } },
        { $sort: { examCount: -1 } },
        { $limit: 5 },
        {
            $lookup: {
                from: 'institutions',
                localField: '_id',
                foreignField: '_id',
                as: 'institution'
            }
        },
        { $unwind: '$institution' },
        {
            $project: {
                name: '$institution.name',
                code: '$institution.code',
                examCount: 1
            }
        }
    ]);

    // 2. Security & Proctoring Snapshot (Last 30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalFlags, criticalAlerts] = await Promise.all([
        AuditLog.countDocuments({ action: 'STUDENT_FLAGGED', createdAt: { $gte: thirtyDaysAgo } }),
        AuditLog.countDocuments({ severity: 'critical', createdAt: { $gte: thirtyDaysAgo } })
    ]);

    // 3. User Distribution
    const userRoles = await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    res.json({
        topInstitutions,
        security: {
            totalFlags,
            criticalAlerts,
            integrityScore: Math.max(0, 100 - (criticalAlerts * 2)) // Simple formula
        },
        distribution: userRoles
    });
});

