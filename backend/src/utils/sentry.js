const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');
const logger = require('./logger');

/**
 * 🛰️ Sentry Initialization Utility
 */
const initSentry = (app) => {
    const dsn = process.env.SENTRY_DSN;
    if (!dsn) {
        logger.warn('⚠️ SENTRY_DSN is missing. Error tracking is disabled.');
        return;
    }

    Sentry.init({
        dsn,
        integrations: [
            // nodeProfilingIntegration is optional but recommended
            nodeProfilingIntegration(),
        ],
        environment: process.env.NODE_ENV || 'development',
        release: process.env.npm_package_version || '1.0.0',
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        profilesSampleRate: 1.0,
        beforeSend(event, hint) {
            // 🛡️ Data Sanitization
            // Ensure no passwords or tokens leave the server if they were missed by Pino
            const sensitiveFields = ['password', 'token', 'authorization', 'cookie'];
            if (event.request && event.request.data) {
                sensitiveFields.forEach(field => {
                    if (event.request.data[field]) event.request.data[field] = '[REDACTED]';
                });
            }
            
            // 🤫 Filter noise (Validation errors, 404s, etc.)
            const error = hint.originalException;
            if (error && error.statusCode && error.statusCode < 500 && error.isOperational) {
                return null; 
            }

            return event;
        }
    });

    logger.info('🛰️ Sentry Initialized Successfully');
};

module.exports = { initSentry, Sentry };
