const IntelligenceLog = require('../models/IntelligenceLog');

/**
 * Centralized Error Handling Middleware
 * Catch all async/sync errors and return uniform JSON responses.
 */
const errorHandler = async (err, req, res, next) => {
    let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
    let message = err.message || 'Internal Server Error';
    let code = err.code || (statusCode === 403 ? 'FORBIDDEN' : statusCode === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR');

    // ─── 1. Handle Known Global Errors ───────────────────
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
        code = 'INVALID_ID';
    }
    if (err.code === 11000) {
        statusCode = 409;
        message = 'Duplicate field value entered.';
        code = 'DUPLICATE_ENTRY';
    }
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(val => val.message).join(', ');
        code = 'VALIDATION_FAILED';
    }

    // ─── 2. Intelligence Logging (Save to DB) ───────────
    // Record if it's a critical server error or a security threat
    if (!err.isOperational || statusCode >= 500 || [401, 403].includes(statusCode)) {
        try {
            await IntelligenceLog.create({
                type: [401, 403].includes(statusCode) ? 'SECURITY' : 'ERROR',
                severity: statusCode >= 500 ? 'critical' : 'high',
                message: message,
                details: {
                    stack: err.stack,
                    code: code,
                    body: req.body,
                    headers: req.headers
                },
                user: req.user?.id,
                path: req.originalUrl,
                method: req.method,
                statusCode,
                ip: req.ip || req.headers['x-forwarded-for'],
                errorId: req.requestId
            });
        } catch (logErr) {
            console.error('🛡️ Failed to save Intelligence Log:', logErr.message);
        }
    }

    // ─── 3. Structured Logging (Console) ─────────────────
    const logPrefix = `🚨 [Error] ID: ${req.requestId || 'N/A'} |`;
    console.error(`${logPrefix} Path: ${req.originalUrl} | Code: ${code} | Message: ${message}`);
    
    if (process.env.NODE_ENV !== 'production' || !err.isOperational) {
        console.error(err.stack);
    }

    // ─── 4. Response Generation ──────────────────────────
    // In production, hide non-operational errors for security
    const isProduction = process.env.NODE_ENV === 'production';
    const response = {
        status: err.status || 'error',
        code,
        message: (isProduction && !err.isOperational) ? 'Something went very wrong!' : message,
        errorId: req.requestId
    };

    if (!isProduction) {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};

/**
 * Helper to catch errors in async controllers without try-catch blocks
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };
