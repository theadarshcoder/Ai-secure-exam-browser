/**
 * ⚡ cacheService.js
 * Redis-based session caching for extreme backend scalability.
 * Prevents "Connection Storms" by shielding MongoDB during mass socket reconnections.
 */

const { getRedisClient } = require('../config/redis');

const SESSION_PREFIX = 'session:';
const DEFAULT_TTL = 86400; // 24 hours in seconds (matching JWT expiry)

// --- Added for Phase 2 Optimization ---
const TTL_ACTIVE_SESSION = 21600; // 6 hours for ongoing exams
const TTL_API_CACHE = 60; // 60 seconds for dashboard data

/**
 * 🔑 Save user session token and permissions to Redis
 */
const saveUserSession = async (userId, token, permissions = []) => {
    const redis = getRedisClient();
    if (!redis) return;

    try {
        const key = `${SESSION_PREFIX}${userId}`;
        const sessionData = JSON.stringify({ token, permissions });
        await redis.set(key, sessionData, 'EX', DEFAULT_TTL);
        console.log(`📡 Redis: Cached session & permissions for user ${userId}`);
    } catch (err) {
        console.warn('⚠️  Redis: Failed to save user session:', err.message);
    }
};

/**
 * 🔍 Retrieve user session data from Redis
 */
const getUserSession = async (userId) => {
    const redis = getRedisClient();
    if (!redis) return null;

    try {
        const key = `${SESSION_PREFIX}${userId}`;
        const data = await redis.get(key);
        if (!data) return null;
        
        // Handle legacy string-only sessions or new JSON sessions
        try {
            return JSON.parse(data);
        } catch (e) {
            return { token: data, permissions: [] };
        }
    } catch (err) {
        console.warn('⚠️  Redis: Failed to retrieve session:', err.message);
        return null;
    }
};

/**
 * 🗑️ Remove user session from Redis (Logout)
 */
const removeUserSession = async (userId) => {
    const redis = getRedisClient();
    if (!redis) return;

    try {
        const key = `${SESSION_PREFIX}${userId}`;
        await redis.del(key);
        console.log(`📡 Redis: Removed session for user ${userId}`);
    } catch (err) {
        console.warn('⚠️  Redis: Failed to delete session:', err.message);
    }
};

/**
 * 💾 Generic Set Cache
 */
const setCache = async (key, data, ttl = TTL_API_CACHE) => {
    const redis = getRedisClient();
    if (!redis) return;
    try {
        await redis.set(key, JSON.stringify(data), 'EX', ttl);
    } catch (err) {
        console.warn(`⚠️  Redis: Failed to set cache for ${key}:`, err.message);
    }
};

/**
 * 🔑 Generic Get Cache
 */
const getCache = async (key) => {
    const redis = getRedisClient();
    if (!redis) return null;
    try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        console.warn(`⚠️  Redis: Failed to get cache for ${key}:`, err.message);
        return null;
    }
};

/**
 * 🗑️ Generic Delete Cache
 */
const clearCache = async (key) => {
    const redis = getRedisClient();
    if (!redis) return;
    try {
        await redis.del(key);
    } catch (err) {
        console.warn(`⚠️  Redis: Failed to clear cache for ${key}:`, err.message);
    }
};

/**
 * 🗑️ Clear Cache by Pattern (e.g., "active_exams_user_*")
 */
const clearPattern = async (pattern) => {
    const redis = getRedisClient();
    if (!redis) return;
    try {
        const keys = await redis.keys(pattern);
        if (keys && keys.length > 0) {
            await redis.del(keys);
            console.log(`📡 Redis: Cleared ${keys.length} keys matching pattern: ${pattern}`);
        }
    } catch (err) {
        console.warn(`⚠️  Redis: Failed to clear pattern ${pattern}:`, err.message);
    }
};

/**
 * 🔥 Fix 21: Cold Start Mitigation (Cache Pre-warming)
 * Pre-populates Redis with common data to reduce DB load on restart.
 */
const preWarmCache = async () => {
    const redis = getRedisClient();
    if (!redis) return;

    try {
        console.log('🔥 [Cache] Starting pre-warming routine...');
        const Setting = require('../models/Setting');
        const Exam = require('../models/Exam');

        // 1. Warm Settings
        const settings = await Setting.findOne().lean();
        if (settings) {
            await redis.set('global_settings', JSON.stringify(settings), 'EX', 86400);
        }

        // 2. Warm Active Exams Metadata
        const activeExams = await Exam.find({ status: 'published' }).select('title category duration').lean();
        if (activeExams && activeExams.length > 0) {
            await redis.set('active_exams_metadata', JSON.stringify(activeExams), 'EX', 3600);
        }

        console.log('✅ [Cache] Pre-warming complete.');
    } catch (err) {
        console.warn('⚠️ [Cache] Pre-warming failed:', err.message);
    }
};

module.exports = {
    saveUserSession,
    getUserSession,
    removeUserSession,
    setCache,
    getCache,
    clearCache,
    clearPattern,
    preWarmCache,
    TTL_ACTIVE_SESSION,
    TTL_API_CACHE
};
