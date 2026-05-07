const featureService = require('../services/featureService');
const AppError = require('../utils/AppError');
const { asyncHandler } = require('./errorMiddleware');

/**
 * 🛡️ Subscription & Limit Enforcement Middleware
 * Prevents actions if limits are reached or features are missing.
 */
const checkQuota = (resourceType) => asyncHandler(async (req, res, next) => {
    const institutionId = req.user.institutionId;
    if (!institutionId || req.user.role === 'super_admin') return next();

    const quota = await featureService.getQuotaStatus(institutionId, resourceType);

    if (quota.isBlocked) {
        let message = `Limit reached for ${resourceType}. Please upgrade your plan.`;
        let code = 'LIMIT_REACHED';

        if (quota.reason === 'SUBSCRIPTION_EXPIRED') {
            message = 'Your subscription has expired. Please renew to continue.';
            code = 'SUBSCRIPTION_EXPIRED';
        } else if (quota.reason === 'INSTITUTION_SUSPENDED') {
            message = 'Your institution has been suspended. Please contact support.';
            code = 'INSTITUTION_SUSPENDED';
        }

        throw new AppError(message, 403, code);
    }

    // Attach quota info to request for potential warning headers
    req.quotaStatus = quota;
    next();
});

const checkFeature = (featureName) => asyncHandler(async (req, res, next) => {
    const institutionId = req.user.institutionId;
    if (!institutionId || req.user.role === 'super_admin') return next();

    const isEnabled = await featureService.hasFeature(institutionId, featureName);

    if (!isEnabled) {
        throw new AppError(`The '${featureName}' feature is not available on your current plan.`, 403, 'FEATURE_LOCKED');
    }

    next();
});

module.exports = {
    checkQuota,
    checkFeature
};
