const Institution = require('../models/Institution');
const cacheService = require('../services/cacheService');

const checkInstitutionActive = async (req, res, next) => {
    // super_admin is always allowed
    if (req.user.role === 'super_admin') return next();
    
    if (!req.user.institutionId) {
        return res.status(403).json({ message: 'No institution assigned to your account' });
    }

    try {
        // Since we are already fetching live DB user status in verifyToken,
        // we should also verify the institution status.
        // Caching is essential here to prevent extra DB hits on every request.
        let status = null;
        const cacheKey = `inst_status:${req.user.institutionId}`;
        const cachedStatus = await cacheService.getCache(cacheKey);

        if (cachedStatus) {
            status = cachedStatus.status;
        } else {
            const institution = await Institution.findById(req.user.institutionId).select('status').lean();
            if (!institution) {
                return res.status(403).json({ message: 'Institution not found' });
            }
            status = institution.status;
            await cacheService.setCache(cacheKey, { status }, 60); // Cache for 60 seconds
        }

        if (status === 'suspended' || status === 'deactivated') {
            return res.status(403).json({ 
                message: 'Your institution account has been suspended or deactivated. Please contact VISION support.',
                code: 'INSTITUTION_SUSPENDED'
            });
        }
        
        next();
    } catch (error) {
        console.error('Institution Middleware Error:', error);
        return res.status(500).json({ message: 'Internal server error validating institution access' });
    }
};

module.exports = { checkInstitutionActive };
