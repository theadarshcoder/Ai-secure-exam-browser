/**
 * 🛡️ AppError.js
 * Custom Error Class to handle operational errors in the application.
 */
class AppError extends Error {
    /**
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {string} code - Machine-readable error code (e.g., 'AUTH_FAILED')
     */
    constructor(message, statusCode, code = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // Marks the error as expected/handled

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
