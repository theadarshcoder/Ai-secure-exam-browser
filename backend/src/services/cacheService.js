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
 * 🔑 Save user session metadata to Redis
 * 
 * DESIGN: Stores sessionVersion + permissions (NOT the full JWT token).
 * This aligns with the sessionVersion invalidation model used in MongoDB (L3).
 * On login/logout, sessionVersion increments → all old tokens become invalid.
 */
const saveUserSession = async (userId, sessionVersion, permissions = []) => {
    const redis = getRedisClient();
    if (!redis) return;

    try {
        const key = `${SESSION_PREFIX}${userId}`;
        const sessionData = JSON.stringify({ sessionVersion, permissions });
        await redis.set(key, sessionData, 'EX', DEFAULT_TTL);
        console.log(`📡 Redis: Cached session v${sessionVersion} for user ${userId}`);
    } catch (err) {
        console.warn('⚠️  Redis: Failed to save user session:', err.message);
    }
};

/**
 * 🔍 Retrieve user session data from Redis
 * Returns: { sessionVersion, permissions } or null
 */
const getUserSession = async (userId) => {
    const redis = getRedisClient();
    if (!redis) return null;

    try {
        const key = `${SESSION_PREFIX}${userId}`;
        const data = await redis.get(key);
        if (!data) return null;
        
        try {
            const parsed = JSON.parse(data);
            // Handle legacy format that stored { token, permissions }
            if (parsed.token && !parsed.sessionVersion) {
                return null; // Force cache miss → DB fallback will re-populate
            }
            return parsed;
        } catch (e) {
            return null; // Corrupt data → force cache miss
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
 * 
 * ⚡ Uses SCAN instead of KEYS to avoid blocking the single-threaded Redis server.
 * KEYS scans the entire keyspace in one shot → freezes ALL operations (sessions, queues, exams).
 * SCAN iterates incrementally in batches → non-blocking, production-safe.
 */
const clearPattern = async (pattern) => {
    const redis = getRedisClient();
    if (!redis) return;
    try {
        let deletedCount = 0;
        const stream = redis.scanStream({
            match: pattern,
            count: 100 // Process ~100 keys per SCAN iteration
        });

        // Collect keys in batches and pipeline-delete for efficiency
        const batch = [];
        for await (const keys of stream) {
            if (keys.length === 0) continue;
            batch.push(...keys);

            // Flush in batches of 100 to avoid unbounded memory growth
            if (batch.length >= 100) {
                const pipeline = redis.pipeline();
                batch.forEach(key => pipeline.del(key));
                await pipeline.exec();
                deletedCount += batch.length;
                batch.length = 0; // Clear batch
            }
        }

        // Flush remaining keys
        if (batch.length > 0) {
            const pipeline = redis.pipeline();
            batch.forEach(key => pipeline.del(key));
            await pipeline.exec();
            deletedCount += batch.length;
        }

        if (deletedCount > 0) {
            console.log(`📡 Redis: Cleared ${deletedCount} keys matching pattern: ${pattern}`);
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

/**
 * 🚀 Telemetry Buffer (Phase 3 Optimization)
 * Buffers frequent telemetry pings into a Redis List to prevent DB Write Overload.
 */
const TELEMETRY_BUFFER_KEY = 'buffer:telemetry_logs';

const pushTelemetryLog = async (logData) => {
    const redis = getRedisClient();
    if (!redis) return null;
    try {
        await redis.rpush(TELEMETRY_BUFFER_KEY, JSON.stringify(logData));
    } catch (err) {
        console.warn('⚠️ Redis: Failed to buffer telemetry log:', err.message);
    }
};

const popAllTelemetryLogs = async () => {
    const redis = getRedisClient();
    if (!redis) return [];
    try {
        // ⚡ Atomic pop-and-clear using Multi
        const multi = redis.multi();
        multi.lrange(TELEMETRY_BUFFER_KEY, 0, -1);
        multi.del(TELEMETRY_BUFFER_KEY);
        const results = await multi.exec();
        
        const rawLogs = results[0][1];
        if (!rawLogs || rawLogs.length === 0) return [];
        
        return rawLogs.map(str => {
            try { return JSON.parse(str); } catch (e) { return null; }
        }).filter(Boolean);
    } catch (err) {
        console.warn('⚠️ Redis: Failed to flush telemetry buffer:', err.message);
        return [];
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
    pushTelemetryLog,
    popAllTelemetryLogs,
    TTL_ACTIVE_SESSION,
    TTL_API_CACHE
};
