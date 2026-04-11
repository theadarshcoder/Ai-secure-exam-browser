/**
 * ⚡ cacheService.js
 * Redis-based session caching for extreme backend scalability.
 * Prevents "Connection Storms" by shielding MongoDB during mass socket reconnections.
 */

const { getRedisClient } = require('../config/redis');

const SESSION_PREFIX = 'session:';
const DEFAULT_TTL = 86400; // 24 hours in seconds (matching JWT expiry)

/**
 * 🔑 Save user session token to Redis
 */
const saveUserSession = async (userId, token) => {
    const redis = getRedisClient();
    if (!redis) return;

    try {
        const key = `${SESSION_PREFIX}${userId}`;
        await redis.set(key, token, { EX: DEFAULT_TTL });
        console.log(`📡 Redis: Cached session for user ${userId}`);
    } catch (err) {
        console.warn('⚠️  Redis: Failed to save user session:', err.message);
    }
};

/**
 * 🔍 Retrieve user session token from Redis
 */
const getUserSession = async (userId) => {
    const redis = getRedisClient();
    if (!redis) return null;

    try {
        const key = `${SESSION_PREFIX}${userId}`;
        return await redis.get(key);
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

module.exports = {
    saveUserSession,
    getUserSession,
    removeUserSession
};
