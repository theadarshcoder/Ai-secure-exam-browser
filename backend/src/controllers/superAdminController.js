const Institution = require('../models/Institution');
const User = require('../models/User');
const DemoRequest = require('../models/DemoRequest');
const AuditLog = require('../models/AuditLog');
const InstitutionSettings = require('../models/InstitutionSettings'); 
const Exam = require('../models/Exam');
const mongoose = require('mongoose');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { getRedisClient } = require('../config/redis');
const { sendAccessApprovedEmail, sendPasswordResetEmail } = require('../services/emailService');

/**
 * 📈 Get Platform-wide Statistics (Cached)
 */
exports.getPlatformStats = asyncHandler(async (req, res) => {
    const redis = getRedisClient();
    const CACHE_KEY = 'platform:stats';

    try {
        const cachedStats = await redis.get(CACHE_KEY);
        if (cachedStats) {
            return res.json(JSON.parse(cachedStats));
        }

        const [totalInstitutions, activeTenants, totalStudents, totalExams, pendingDemos] = await Promise.all([
            Institution.countDocuments(),
            Institution.countDocuments({ status: 'active' }),
            User.countDocuments({ role: 'student' }),
            Exam.countDocuments().catch(() => 0),
            DemoRequest.countDocuments({ status: 'pending' })
        ]);

        const stats = {
            totalInstitutions,
            activeTenants,
            totalStudents,
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
    const requests = await DemoRequest.find().sort({ createdAt: -1 });
    res.json(requests);
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
    const institutions = await Institution.find().sort({ createdAt: -1 });
    res.json(institutions);
});

/**
 * 🔍 Get single institution details
 */
exports.getInstitutionDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const institution = await Institution.findById(id);
    if (!institution) throw new Error('Institution not found');

    const admins = await User.find({ institutionId: id, role: 'admin' }).select('-password');
    const settings = await InstitutionSettings.findOne({ institutionId: id });

    res.json({ institution, admins, settings });
});

/**
 * ⚖️ Toggle institution status (Suspend/Activate)
 */
exports.toggleInstitutionStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['active', 'suspended'].includes(status)) throw new Error('Invalid status');

    const institution = await Institution.findByIdAndUpdate(id, { status }, { new: true });
    if (!institution) throw new Error('Institution not found');

    // Audit Log
    await AuditLog.create({
        performedBy: req.user.id,
        action: status === 'suspended' ? 'SUSPEND_INSTITUTION' : 'ACTIVATE_INSTITUTION',
        severity: status === 'suspended' ? 'critical' : 'info',
        institutionId: id,
        actorRole: 'super_admin'
    });

    res.json({ message: `Institution status updated to ${status}`, institution });
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
