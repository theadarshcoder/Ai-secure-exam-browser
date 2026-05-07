const Institution = require('../models/Institution');
const cacheService = require('../services/cacheService');

/**
 * 🛡️ Global Institution Access Guard
 * Enforces SaaS lifecycle states (Active, Suspended, Maintenance, Expired, etc.)
 * Supports Read-Only mode for maintenance and grace-period metadata.
 */
const enforceInstitutionAccess = async (req, res, next) => {
    // 1. Super Admins bypass all institutional blocks
    if (req.user.role === 'super_admin') return next();
    
    if (!req.user.institutionId) {
        return res.status(403).json({ 
            message: 'Access Denied: No institution context found.',
            code: 'NO_INSTITUTION'
        });
    }

    try {
        const instId = req.user.institutionId;
        const cacheKey = `inst_access:${instId}`;
        
        // 2. Performance: Try Cache First
        let instData = await cacheService.getCache(cacheKey);

        if (!instData) {
            const institution = await Institution.findById(instId).select('status trialEndsAt name').lean();
            if (!institution) {
                return res.status(404).json({ 
                    message: 'Institution not found.',
                    code: 'INSTITUTION_NOT_FOUND'
                });
            }
            instData = institution;
            await cacheService.setCache(cacheKey, instData, 120); // 2 minute cache
        }

        const { status, trialEndsAt } = instData;
        const method = req.method;

        // 3. Mapping States to Behaviors
        
        // State A: Suspended (Hard Block)
        if (status === 'suspended') {
            return res.status(403).json({ 
                message: 'Your institution has been suspended for security or policy violations. Contact support.',
                code: 'INSTITUTION_SUSPENDED'
            });
        }

        // State B: Maintenance (Read-Only Mode)
        if (status === 'maintenance') {
            // Allow GET requests for dashboard/viewing, block everything else
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
                return res.status(503).json({ 
                    message: 'Platform is currently in read-only maintenance mode. Please try again later.',
                    code: 'MAINTENANCE_MODE'
                });
            }
        }

        // State C: Trial Expired (Hard Block)
        if (status === 'trial_expired') {
            return res.status(403).json({ 
                message: 'Your trial has expired. Please upgrade your plan to continue using the platform.',
                code: 'TRIAL_EXPIRED'
            });
        }

        // State D: Payment Failed (Hard Block)
        if (status === 'payment_failed') {
            return res.status(402).json({ 
                message: 'Payment failed. Please update your billing information to restore access.',
                code: 'PAYMENT_REQUIRED'
            });
        }

        // State E: Grace Period (Allow with Metadata)
        if (status === 'grace_period') {
            // Inject metadata into response headers or locally for later use
            res.setHeader('X-SaaS-Grace-Period', 'true');
        }

        // 4. Inject Institution Context for downstream use
        req.institutionStatus = status;
        req.institutionData = instData;

        next();
    } catch (error) {
        console.error('🛡️ Institution Access Guard Error:', error);
        return res.status(500).json({ message: 'Internal server error validating access.' });
    }
};

module.exports = { enforceInstitutionAccess, checkInstitutionActive: enforceInstitutionAccess };
