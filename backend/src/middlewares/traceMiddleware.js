const crypto = require('crypto');
const { storage } = require('../utils/asyncStorage');

/**
 * traceMiddleware
 * Generates or retains a unique X-Request-Id for every request.
 * Wraps the request in AsyncLocalStorage context for logging traceability.
 */
const traceMiddleware = (req, res, next) => {
    // Retain existing ID (for retries) or generate a new one
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    // Attach to request object
    req.requestId = requestId;

    // Send back in headers so frontend can reference it
    res.setHeader('X-Request-Id', requestId);

    // 🧠 WRAP IN CONTEXT: Everything inside next() will have access to this store
    storage.run({
        requestId,
        ip: req.ip || req.headers['x-forwarded-for'],
        method: req.method,
        path: req.path,
        // userId and institutionId will be added by auth middleware later if needed
    }, () => {
        next();
    });
};

module.exports = traceMiddleware;
