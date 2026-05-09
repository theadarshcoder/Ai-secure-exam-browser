const PLANS = require('../config/plans');
const Subscription = require('../models/Subscription');
const InstitutionUsage = require('../models/InstitutionUsage');
const Institution = require('../models/Institution');
const AppError = require('../utils/AppError');

/**
 * 🛠️ Feature & Quota Service
 * Source of truth for what an institution can and cannot do.
 */

/**
 * Check if a feature is enabled for the institution
 */
const hasFeature = async (institutionId, featureName) => {
    const sub = await Subscription.findOne({ institutionId, status: { $in: ['active', 'trialing'] } });
    if (!sub) return false;

    const plan = PLANS[sub.planId.toUpperCase()];
    return !!(plan && plan.features[featureName]);
};

/**
 * Get detailed quota status for a resource
 * Returns used, limit, percentage, and block status.
 */
const getQuotaStatus = async (institutionId, resourceType) => {
    const [sub, usage, inst] = await Promise.all([
        Subscription.findOne({ institutionId }),
        InstitutionUsage.findOne({ institutionId }),
        Institution.findById(institutionId)
    ]);

    if (!sub || !inst) return { isBlocked: true, reason: 'SUBSCRIPTION_NOT_FOUND' };

    // Global Suspension Check
    if (inst.isSuspended) return { isBlocked: true, reason: 'INSTITUTION_SUSPENDED' };

    const plan = PLANS[sub.planId.toUpperCase()];
    if (!plan) return { isBlocked: true, reason: 'PLAN_NOT_FOUND' };

    // Expiry Check
    const now = new Date();
    if (sub.status === 'expired' || (sub.currentPeriodEnd && sub.currentPeriodEnd < now)) {
        return { isBlocked: true, reason: 'SUBSCRIPTION_EXPIRED', used: 0, limit: 0, percentage: 100 };
    }

    // 🛡️ Fix: Correct Field Mapping for Usage vs Limits
    const mapping = {
        student: { limit: 'maxStudents', used: 'studentsUsed' },
        exam: { limit: 'maxExams', used: 'examsUsed' },
        mentor: { limit: 'maxMentors', used: 'mentorsUsed' },
        aiMinutes: { limit: 'aiMinutes', used: 'aiMinutesUsed' }
    };

    const config = mapping[resourceType] || { limit: resourceType, used: resourceType };
    
    const actualLimit = plan.limits[config.limit] || 0;
    const used = usage ? (usage[config.used] || 0) : 0;
    
    const percentage = actualLimit === Infinity ? 0 : Math.min(100, (used / actualLimit) * 100);

    return {
        used,
        limit: actualLimit,
        percentage,
        isBlocked: used >= actualLimit,
        isWarning: percentage >= 80,
        planName: plan.name
    };
};

module.exports = {
    hasFeature,
    getQuotaStatus
};
