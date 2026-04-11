/**
 * Centralized Error Handling Middleware
 * Catch all async/sync errors and return uniform JSON responses.
 */
const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    // Server console mein error log karte waqt Request ID zaroor dikhayein
    console.error(`🚨 [Backend Error] RequestID: ${req.requestId || 'N/A'} | Path: ${req.originalUrl} | Message: ${err.message}`);
    
    if (process.env.NODE_ENV !== 'production') {
        console.error(err.stack);
    }

    res.status(statusCode).json({
        message: err.message || 'Internal Server Error',
        errorId: req.requestId, // Frontend ko error response ke sath Request ID bhej dein
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};

/**
 * Helper to catch errors in async controllers without try-catch blocks
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };
