const crypto = require('crypto');
const { getRedisClient } = require('../config/redis');

/**
 * Generates a dynamic HMAC-SHA256 hash based on a deep fingerprint and secret.
 * @param {Object} fingerprint - { userAgent, platform, width, height }
 * @param {string} secret - ELECTRON_SECRET
 * @returns {string}
 */
const generateDeepHash = (fingerprint, secret) => {
    if (!secret) return null;
    const data = `${fingerprint.userAgent}|${fingerprint.platform}|${fingerprint.width}|${fingerprint.height}`;
    return crypto
        .createHmac('sha256', secret)
        .update(data)
        .digest('hex');
};

/**
 * Verifies the key, checks for Replay Attacks (Nonce), and Stale Requests (Timestamp).
 */
const verifySecureRequest = async (providedKey, fingerprint, nonce, timestamp, secret) => {
    if (!providedKey || !nonce || !timestamp) {
        return { valid: false, reason: 'Missing security headers' };
    }

    // 1. Stale Request Check (2-minute window)
    const requestTime = parseInt(timestamp);
    const currentTime = Date.now();
    if (isNaN(requestTime) || Math.abs(currentTime - requestTime) > 120000) {
        return { valid: false, reason: 'Stale request detected (Clock mismatch)' };
    }

    // 2. Verify Hash
    const expectedHash = generateDeepHash(fingerprint, secret);
    if (providedKey !== expectedHash) {
        return { valid: false, reason: 'Fingerprint/Key mismatch' };
    }

    // 2. Anti-Replay Check (Nonce)
    const redisClient = getRedisClient();
    if (redisClient) {
        const nonceKey = `nonce:${nonce}`;
        const exists = await redisClient.get(nonceKey);
        if (exists) return { valid: false, reason: 'Replay attack detected' };
        
        // Mark nonce as used for 5 minutes
        await redisClient.set(nonceKey, 'used', { EX: 300 });
    }

    return { valid: true };
};

module.exports = {
    generateDeepHash,
    verifySecureRequest
};
