const { getRedisClient } = require('../config/redis');
const GlobalSettings = require('../models/GlobalSettings');

/**
 * 🛡️ Platform Governance Middleware
 * Controls access based on the global platform mode (active, readonly, maintenance, locked).
 * Uses Redis caching with a short TTL to prevent DB bottlenecks.
 */
const platformModeMiddleware = async (req, res, next) => {
    // 1. Skip checks for Super Admin (Platform Owner always has access)
    if (req.user && req.user.role === 'super_admin') {
        return next();
    }

    const redis = getRedisClient();
    const CACHE_KEY = 'platform:mode';
    
    // Normalize path for matching (remove /api/v1 or /api prefix)
    const normalizedPath = req.originalUrl.replace(/^\/api(\/v1)?/, '');

    // 🛡️ [PHASE 1] Global Exemptions (Always allowed)
    const GLOBAL_EXEMPT_PATHS = [
        '/public/platform/status',
        '/health',
        '/version'
    ];
    if (GLOBAL_EXEMPT_PATHS.some(path => normalizedPath.startsWith(path))) {
        return next();
    }

    try {
        // 2. Try to get mode from Redis Cache
        let mode = await redis.get(CACHE_KEY);

        if (!mode) {
            // 3. Fallback to DB if cache missed
            const settings = await GlobalSettings.getSettings();
            mode = settings.platformMode;
            // Cache for 60 seconds (Short TTL for responsiveness)
            await redis.set(CACHE_KEY, mode, 'EX', 60);
        }

        // 4. Governance Logic
        if (mode === 'active') {
            return next();
        }

        // 🛑 [MODE] LOCKED: Total Blackout (Except Super Admin already handled)
        if (mode === 'locked') {
            return res.status(403).json({
                status: 'error',
                code: 'PLATFORM_LOCKED',
                message: 'Platform is currently LOCKED. Access restricted to Platform Owners only.'
            });
        }

        // 🛠️ [MODE] MAINTENANCE: Allow only Auth and Health
        if (mode === 'maintenance') {
            const MAINTENANCE_ALLOWED_PATHS = [
                '/auth/login',
                '/auth/logout',
                '/auth/refresh',
                '/auth/me'
            ];
            
            if (MAINTENANCE_ALLOWED_PATHS.some(path => normalizedPath.startsWith(path))) {
                return next();
            }

            return res.status(503).json({
                status: 'error',
                code: 'PLATFORM_MAINTENANCE',
                message: 'Platform is undergoing maintenance. Exams and management features are temporarily unavailable.'
            });
        }

        // 📖 [MODE] READ-ONLY: Block Mutations
        if (mode === 'readonly') {
            const MUTATION_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
            
            if (MUTATION_METHODS.includes(req.method)) {
                // Allow essential mutations (Auth session management)
                const SAFE_MUTATIONS = [
                    '/auth/login',
                    '/auth/logout',
                    '/auth/refresh',
                    '/auth/re-authenticate'
                ];

                if (SAFE_MUTATIONS.some(path => normalizedPath.startsWith(path))) {
                    return next();
                }

                return res.status(403).json({
                    status: 'error',
                    code: 'PLATFORM_READONLY',
                    message: 'Platform is currently in READ-ONLY mode. Changes are temporarily disabled.'
                });
            }
            return next();
        }

        next();
    } catch (error) {
        console.error('🛡️ Platform Middleware Error:', error);
        next(); // Fail open to prevent platform-wide blackout if Redis/DB fails
    }
};

module.exports = { platformModeMiddleware };
