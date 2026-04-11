const { v4: uuidv4 } = require('uuid');

/**
 * traceMiddleware
 * Generates or retains a unique X-Request-Id for every request.
 * Useful for log correlation and debugging student issues.
 */
const traceMiddleware = (req, res, next) => {
    // Retain existing ID (for retries) or generate a new one
    const requestId = req.headers['x-request-id'] || uuidv4();

    // Attach to request object for use in controllers/error handlers
    req.requestId = requestId;

    // Send back in headers so frontend can reference it
    res.setHeader('X-Request-Id', requestId);

    next();
};

module.exports = traceMiddleware;
