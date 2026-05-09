const PLANS = require('../config/plans');
const { PLAN_TYPES } = require('../utils/billingConstants');
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

    if (!sub || !inst) {
        // 🛡️ Self-Healing: If subscription or institution is missing, fallback to Trial limits
        const fallbackPlan = PLANS[PLAN_TYPES.TRIAL.toUpperCase()];
        const mapping = { exam: 'examsUsed', student: 'studentsUsed', mentor: 'mentorsUsed' };
        const used = usage ? (usage[mapping[resourceType]] || 0) : 0;
        const limitKey = resourceType === 'exam' ? 'maxExams' : (resourceType === 'student' ? 'maxStudents' : 'maxMentors');
        const limit = fallbackPlan.limits[limitKey] || 0;

        return {
            used,
            limit,
            isBlocked: limit !== 0 && used >= limit,
            reason: 'FALLBACK_TRIAL',
            planName: 'Default Trial'
        };
    }

    // Global Suspension Check
    if (inst.isSuspended) return { isBlocked: true, reason: 'INSTITUTION_SUSPENDED' };

    const plan = PLANS[sub.planId.toUpperCase()] || PLANS[PLAN_TYPES.TRIAL.toUpperCase()];

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
    
    // 🛡️ Fix: Ensure we don't block 0 usage if limit is 0/undefined (unless explicitly intended)
    const rawLimit = plan.limits[config.limit];
    const actualLimit = rawLimit === undefined ? (resourceType === 'exam' ? 5 : 0) : rawLimit;
    const used = usage ? (usage[config.used] || 0) : 0;
    
    // Detailed logging for troubleshooting (Visible in Render logs)
    console.log(`[Quota Check] Inst: ${institutionId} | Type: ${resourceType} | Used: ${used} | Limit: ${actualLimit}`);

    const percentage = actualLimit === Infinity ? 0 : (actualLimit === 0 ? 100 : Math.min(100, (used / actualLimit) * 100));

    return {
        used,
        limit: actualLimit,
        percentage,
        isBlocked: actualLimit !== Infinity && used >= actualLimit && actualLimit !== 0,
        isWarning: percentage >= 80,
        planName: plan.name
    };
};

module.exports = {
    hasFeature,
    getQuotaStatus
};
