const logger = require('./logger');

/**
 * 🚩 Feature Flag System
 * Allows enabling/disabling critical components at runtime.
 * Hierarchy: Environment Variable > Default
 */

const FLAGS = {
    AI_ENABLED: process.env.AI_ENABLED !== 'false',
    BILLING_ENABLED: process.env.BILLING_ENABLED !== 'false',
    EMAILS_ENABLED: process.env.EMAILS_ENABLED !== 'false',
    WEBSOCKETS_ENABLED: process.env.WEBSOCKETS_ENABLED !== 'false',
    MAINTENANCE_MODE: process.env.MAINTENANCE_MODE === 'true'
};

/**
 * Check if a feature is enabled
 */
const isEnabled = (flag) => {
    const enabled = FLAGS[flag];
    if (enabled === undefined) {
        logger.warn({ flag }, `⚠️  Accessing unknown feature flag`);
        return false;
    }
    return enabled;
};

/**
 * Middleware to protect routes via feature flags
 */
const featureFlagGuard = (flag) => (req, res, next) => {
    if (!isEnabled(flag)) {
        logger.warn({ flag, path: req.originalUrl }, `🚫 Feature disabled via flag`);
        return res.status(503).json({
            success: false,
            error: {
                code: 'FEATURE_DISABLED',
                message: `${flag.replace('_ENABLED', '')} service is currently unavailable.`
            }
        });
    }
    next();
};

module.exports = {
    FLAGS,
    isEnabled,
    featureFlagGuard
};
