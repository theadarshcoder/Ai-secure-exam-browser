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
    if (sub.status === 'expired' || sub.currentPeriodEnd < now) {
        return { isBlocked: true, reason: 'SUBSCRIPTION_EXPIRED', used: 0, limit: 0, percentage: 100 };
    }

    const limit = plan.limits[resourceType] || 0;
    const used = usage ? (usage[resourceType] || 0) : 0;
    
    // Special handling for Student Invites in bulkInvite logic (maxStudents)
    const normalizedResourceType = resourceType === 'student' ? 'maxStudents' : 
                                  resourceType === 'exam' ? 'maxExams' : 
                                  resourceType === 'mentor' ? 'maxMentors' : resourceType;
    
    const actualLimit = plan.limits[normalizedResourceType] || limit;
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
