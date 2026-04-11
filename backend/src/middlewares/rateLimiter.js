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

module.exports = { codeExecutionLimiter };
