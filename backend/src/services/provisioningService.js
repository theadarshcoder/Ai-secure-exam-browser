const Institution = require('../models/Institution');
const InstitutionSettings = require('../models/InstitutionSettings');
const InstitutionUsage = require('../models/InstitutionUsage');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const crypto = require('crypto');
const mongoose = require('mongoose');

/**
 * 🚀 Enterprise-Grade Tenant Provisioning
 * Automatically sets up a new institution, its settings, usage tracking, and admin account.
 */
const provisionTrialInstitution = async (formData, session) => {
    const { name, email, institutionName, website } = formData;

    // 1. Create Institution (Trial Tier)
    const institution = new Institution({
        name: institutionName,
        code: institutionName.replace(/\s+/g, '').substring(0, 10).toUpperCase() + Math.floor(1000 + Math.random() * 9000),
        domain: website || `${institutionName.replace(/\s+/g, '').toLowerCase()}.edu`,
        plan: 'trial',
        status: 'trialing',
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 Days Trial
        maxStudents: 50,
        maxExams: 2,
        maxMentors: 1
    });
    await institution.save({ session });

    // 2. Initialize Subscription (Trial)
    const subscription = new Subscription({
        institutionId: institution._id,
        planId: 'trial',
        status: 'trialing',
        currentPeriodEnd: institution.trialEndsAt,
        trialEndsAt: institution.trialEndsAt
    });
    await subscription.save({ session });

    // Link back to institution
    institution.subscriptionId = subscription._id;
    await institution.save({ session });

    // 3. Initialize Usage Tracking
    const usage = new InstitutionUsage({
        institutionId: institution._id,
        studentsUsed: 0,
        examsUsed: 0
    });
    await usage.save({ session });

    // 3. Initialize Default Settings
    const settings = new InstitutionSettings({
        institutionId: institution._id
    });
    await settings.save({ session });

    // 4. Create Admin Account (No Password - Onboarding Path)
    const setupToken = crypto.randomBytes(32).toString('hex');
    const setupTokenHash = crypto.createHash('sha256').update(setupToken).digest('hex');

    const adminUser = new User({
        name,
        email: email.toLowerCase(),
        role: 'admin',
        institutionId: institution._id,
        status: 'invited',
        passwordSetupToken: setupTokenHash,
        passwordSetupExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 Hours to set password
    });
    await adminUser.save({ session });

    // 5. Audit Log
    await AuditLog.create([{
        performedBy: adminUser._id, // Self-provisioned
        actorRole: 'admin',
        action: 'TENANT_AUTO_PROVISIONED',
        severity: 'info',
        institutionId: institution._id,
        details: { plan: 'trial', setupTokenGenerated: true }
    }], { session });

    return { institution, adminUser, setupToken };
};

module.exports = {
    provisionTrialInstitution
};
