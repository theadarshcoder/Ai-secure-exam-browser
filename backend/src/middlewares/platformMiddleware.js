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

        if (mode === 'readonly') {
            // Block all mutations (POST, PUT, PATCH, DELETE)
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
                return res.status(403).json({
                    status: 'error',
                    code: 'PLATFORM_READONLY',
                    message: 'Platform is currently in READ-ONLY mode. Changes are temporarily disabled.'
                });
            }
            return next();
        }

        if (mode === 'maintenance') {
            // Allow login and profile viewing, but block exams and critical operations
            const allowedPaths = ['/api/auth/login', '/api/auth/me', '/api/auth/logout'];
            if (allowedPaths.some(path => req.originalUrl.includes(path))) {
                return next();
            }

            return res.status(503).json({
                status: 'error',
                code: 'PLATFORM_MAINTENANCE',
                message: 'Platform is undergoing maintenance. Exams and management features are temporarily unavailable.'
            });
        }

        if (mode === 'locked') {
            // Only Super Admin allowed (already handled above)
            return res.status(403).json({
                status: 'error',
                code: 'PLATFORM_LOCKED',
                message: 'Platform is currently LOCKED. Access restricted to Platform Owners only.'
            });
        }

        next();
    } catch (error) {
        console.error('🛡️ Platform Middleware Error:', error);
        next(); // Fail open to prevent platform-wide blackout if Redis/DB fails
    }
};

module.exports = { platformModeMiddleware };
