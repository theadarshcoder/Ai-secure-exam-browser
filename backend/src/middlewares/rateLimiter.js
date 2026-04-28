const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { getRedisClient } = require('../config/redis');

// ⚡ SHARED STORE HELPER: Cluster-Safe Rate Limiting
const createRedisStore = (label) => {
    const client = getRedisClient();
    if (!client) {
        console.warn(`⚠️  [SCALING] Redis not ready. Using In-Memory fallback for ${label} rate limiter.`);
        return undefined; 
    }
    return new RedisStore({
        sendCommand: (...args) => client.call(...args),
        prefix: `vision_rl:${label}:`,
    });
};

/**
 * 🛡️ Code Execution Rate Limiter
 * Specifically designed to protect Judge0 API from exhaustion.
 * Students: 1 per 10s | Mentors/Admins: 10 per 10s
 */
const codeExecutionLimiter = rateLimit({
    windowMs: 10 * 1000, 
    max: (req) => {
        if (req.user?.role === 'admin' || req.user?.role === 'super_mentor') return 100;
        if (req.user?.role === 'mentor') return 20;
        return 1; // Default for students
    },
    store: createRedisStore('code_exec'),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req, res) => req.user?.id || ipKeyGenerator(req, res),
    message: {
        allPassed: false,
        error: 'Cooldown Active',
        details: 'Please wait between code executions to maintain system stability.',
        isRawExecution: true
    }
});

/**
 * 🛡️ Telemetry Limiter
 * Students: 20 per min | Mentors: 100 per min
 */
const telemetryLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: (req) => {
        if (req.user?.role === 'admin' || req.user?.role === 'super_mentor') return 500;
        return 20;
    },
    store: createRedisStore('telemetry'),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req, res) => req.user?.id || ipKeyGenerator(req, res),
    message: {
        success: false,
        message: 'Telemetry rate limit exceeded.'
    }
});

/**
 * 🔗 External Import Rate Limiter
 */
const importLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: (req) => (req.user?.role === 'admin' ? 50 : 5),
    store: createRedisStore('import'),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req, res) => req.user?.id || ipKeyGenerator(req, res),
    message: {
        success: false,
        error: "Too many import requests."
    }
});

/**
 * 💾 Autosave Rate Limiter
 */
const autosaveLimiter = rateLimit({
    windowMs: 30 * 1000,
    max: (req) => (req.user?.role === 'admin' ? 100 : 20),
    store: createRedisStore('autosave'),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req, res) => req.user?.id || ipKeyGenerator(req, res),
    message: 'Too many autosave requests.'
});

/**
 * 🛡️ Secure Action Rate Limiter
 * Specifically for security-sensitive operations like starting/submitting exams
 * and heartbeats.
 */
const secureActionLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: (req) => {
        if (req.path.includes('heartbeat')) return 5; // 30s interval = 2/min, 5 is safe
        return 10; // Start/Submit should be rare
    },
    store: createRedisStore('secure_action'),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req, res) => req.user?.id || ipKeyGenerator(req, res),
    message: {
        success: false,
        error: "Too many security-sensitive requests. Please slow down."
    }
});

/**
 * 📧 Invite Verification Limiter
 */
const inviteVerifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 attempts
    store: createRedisStore('invite_verify'),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: ipKeyGenerator,
    message: {
        success: false,
        error: "Too many verification attempts. Please try again later."
    }
});

module.exports = { 
    codeExecutionLimiter, 
    telemetryLimiter, 
    importLimiter, 
    autosaveLimiter,
    secureActionLimiter,
    inviteVerifyLimiter
};
