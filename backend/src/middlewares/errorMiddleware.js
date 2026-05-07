const IntelligenceLog = require('../models/IntelligenceLog');
const logger = require('../utils/logger');
const { Sentry } = require('../utils/sentry');
const ErrorCodes = require('../utils/errorCodes');

/**
 * Centralized Error Handling Middleware
 * Catch all async/sync errors and return uniform JSON responses.
 */
const errorHandler = async (err, req, res, next) => {
    let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
    let message = err.message || 'Internal Server Error';
    let code = err.code || (
        statusCode === 403 ? ErrorCodes.AUTH_FORBIDDEN : 
        statusCode === 401 ? ErrorCodes.AUTH_INVALID : 
        statusCode === 429 ? ErrorCodes.RATE_LIMIT_EXCEEDED :
        ErrorCodes.SYSTEM_ERROR
    );

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
        code = ErrorCodes.VALIDATION_ERROR;
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

            // 🛰️ Report to Sentry if Critical or Unexpected
            if (statusCode >= 500 || !err.isOperational) {
                Sentry.captureException(err, {
                    tags: { code, requestId: req.requestId },
                    user: req.user ? { id: req.user.id, email: req.user.email } : undefined,
                    extra: { path: req.originalUrl, method: req.method }
                });
            }
        } catch (logErr) {
            logger.error({ err: logErr.message }, '🛡️ Failed to save Intelligence Log or Sentry Event');
        }
    }

    // ─── 3. Structured Logging (Pino) ───────────────────
    logger.error({
        requestId: req.requestId,
        path: req.originalUrl,
        code,
        statusCode,
        err: message
    }, `🚨 [Error] ${message}`);
    
    if (process.env.NODE_ENV !== 'production' && !err.isOperational) {
        logger.debug({ stack: err.stack }, 'Error Stack Trace');
    }

    // ─── 4. Response Generation ──────────────────────────
    const isProduction = process.env.NODE_ENV === 'production';
    const response = {
        success: false,
        error: {
            code,
            message: (isProduction && !err.isOperational && statusCode >= 500) 
                ? 'Something went very wrong!' 
                : message,
            requestId: req.requestId
        }
    };

    if (!isProduction) {
        response.error.stack = err.stack;
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
