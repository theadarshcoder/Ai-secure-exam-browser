const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * 🛰️ Advanced Redis-Backed Rate Limiting
 * Standardizes API limits across different categories to prevent brute-force and DoS.
 */

const createLimiter = (options) => {
    const redisClient = getRedisClient();
    
    return rateLimit({
        windowMs: options.windowMs || 15 * 60 * 1000, // Default 15 mins
        max: options.max || 100, // Default 100 requests per window
        standardHeaders: true,
        legacyHeaders: false,
        store: redisClient ? new RedisStore({
            sendCommand: (...args) => redisClient.call(...args),
            prefix: `rate-limit:${options.category}:`
        }) : undefined, // Fallback to memory if Redis is down
        handler: (req, res) => {
            logger.warn({ 
                ip: req.ip, 
                category: options.category, 
                path: req.originalUrl 
            }, `🚫 Rate limit exceeded [${options.category}]`);
            
            res.status(429).json({
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: options.message || 'Too many requests, please try again later.'
                }
            });
        },
        keyGenerator: (req) => {
            return req.user ? req.user.id : req.ip;
        },
        validate: { keyGeneratorIpFallback: false }
    });
};

// 🔐 Auth Limiter (Strict: prevents brute-force)
exports.authLimiter = createLimiter({
    category: 'auth',
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 15, // 15 attempts
    message: 'Too many login attempts. Please try again in 15 minutes.'
});

// 💳 Billing & Payment Limiter
exports.billingLimiter = createLimiter({
    category: 'billing',
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, 
    message: 'Payment action limit reached. Please contact support if this is an error.'
});

// 🤖 AI Generation Limiter
exports.aiLimiter = createLimiter({
    category: 'ai',
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50,
    message: 'AI usage limit reached for this hour.'
});

// 📁 Upload Limiter
exports.uploadLimiter = createLimiter({
    category: 'upload',
    windowMs: 30 * 60 * 1000, // 30 mins
    max: 30,
    message: 'Upload limit exceeded. Please wait before uploading more files.'
});

// 🩺 Public API Limiter
exports.publicLimiter = createLimiter({
    category: 'public',
    windowMs: 15 * 60 * 1000,
    max: 100
});

// 📧 Invite Verification Limiter
exports.inviteVerifyLimiter = createLimiter({
    category: 'invite-verify',
    windowMs: 10 * 60 * 1000, // 10 mins
    max: 10 // Only 10 attempts to verify an invite
});

// ⚡ Global Standard Limiter
exports.globalLimiter = createLimiter({
    category: 'global',
    windowMs: 1 * 60 * 1000, // 1 min
    max: 120 // 2 requests per second avg
});

// 🔗 Legacy Aliases for Backward Compatibility
exports.telemetryLimiter = exports.publicLimiter;
exports.autosaveLimiter = exports.globalLimiter;
exports.secureActionLimiter = exports.authLimiter;
exports.codeExecutionLimiter = exports.publicLimiter;
exports.importLimiter = exports.publicLimiter;
exports.demoRequestLimiter = exports.publicLimiter;
exports.demoEmailLimiter = exports.publicLimiter;
