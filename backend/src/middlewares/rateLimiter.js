const rateLimit = require('express-rate-limit');

/**
 * 🛡️ Code Execution Rate Limiter
 * Specifically designed to protect Judge0 API from exhaustion.
 * Limits students to 1 execution every 10 seconds.
 */
const codeExecutionLimiter = rateLimit({
    windowMs: 10 * 1000, // 10 seconds
    max: 1, // Limit each user to 1 request per window
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    validate: { keyGenerator: false },
    keyGenerator: (req) => {
        // Limit by user ID since students are authenticated
        return req.user?.id || req.ip;
    },
    message: {
        allPassed: false,
        error: 'Cooldown Active',
        details: 'Please wait 10 seconds between code executions to maintain system stability.',
        isRawExecution: true
    },
    skip: (req) => {
        // Admins and Mentors are not rate-limited for testing
        return req.user?.role === 'admin' || req.user?.role === 'mentor';
    }
});

const telemetryLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Max 10 telemetry logs per minute
    standardHeaders: true,
    legacyHeaders: false,
    validate: { keyGenerator: false },
    keyGenerator: (req) => req.user?.id || req.ip,
    message: {
        success: false,
        message: 'Rate limit exceeded. Please try again later.'
    }
});

/**
 * 🔗 External Import Rate Limiter
 * Limits scraping requests to prevent spamming external APIs.
 */
const importLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // Limit each user to 5 import requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    validate: { keyGenerator: false },
    keyGenerator: (req) => req.user?.id || req.ip,
    message: {
        success: false,
        error: "Too many import requests. Please try again after a minute."
    }
});

/**
 * 💾 Autosave Rate Limiter
 * Limits silent progress saves during exam.
 */
const autosaveLimiter = rateLimit({
    windowMs: 30 * 1000, // 30 seconds
    max: 20, // 20 requests allowed per 30 sec
    standardHeaders: true,
    legacyHeaders: false,
    validate: { keyGenerator: false },
    keyGenerator: (req) => req.user?.id || req.ip,
    message: 'Too many autosave requests, please wait'
});

module.exports = { codeExecutionLimiter, telemetryLimiter, importLimiter, autosaveLimiter };
