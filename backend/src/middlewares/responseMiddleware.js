/**
 * 🎨 Shared Response Middleware
 * Standardizes all API responses to follow the format:
 * {
 *   "success": boolean,
 *   "data": object | null,
 *   "error": object | null,
 *   "meta": object
 * }
 */

const responseStandardizer = (req, res, next) => {
    // Save the original res.json function
    const originalJson = res.json;

    res.json = function (data) {
        // If data already follows the standard (has success field), don't wrap it again
        if (data && typeof data === 'object' && ('success' in data)) {
            return originalJson.call(this, data);
        }

        // Check if this is an error response (usually handled by errorMiddleware, but just in case)
        const isError = res.statusCode >= 400;

        const standardizedResponse = {
            success: !isError,
            data: isError ? null : data,
            error: isError ? (data.error || data) : null,
            meta: {
                timestamp: new Date().toISOString(),
                requestId: req.requestId,
                path: req.originalUrl
            }
        };

        // If it was an error but didn't have a structured error object, wrap the message
        if (isError && typeof standardizedResponse.error === 'string') {
            standardizedResponse.error = {
                message: standardizedResponse.error,
                code: 'API_ERROR'
            };
        }

        return originalJson.call(this, standardizedResponse);
    };

    next();
};

module.exports = responseStandardizer;
