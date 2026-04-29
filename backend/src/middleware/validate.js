const { z } = require('zod');

/**
 * 🛡️ Input Governance Middleware
 * Validates incoming requests against a Zod schema.
 * Standardizes error responses for the entire platform.
 * 
 * @param {z.ZodSchema} schema - The Zod schema to validate against
 */
const validate = (schema) => (req, res, next) => {
    try {
        const validated = schema.parse({
            body: req.body,
            params: req.params,
            query: req.query
        });

        // 🛡️ Replace raw inputs with validated/sanitized versions
        req.body = validated.body || req.body;
        req.params = validated.params || req.params;
        req.query = validated.query || req.query;

        next();
    } catch (err) {
        if (err instanceof z.ZodError) {
            // 🛡️ Error shape MUST be compatible with frontend expectations:
            // Frontend reads: err.response.data.error (expects STRING)
            // Frontend reads: err.response.data.message (expects STRING)
            const fieldErrors = err.errors.map(e => `${e.path.slice(1).join('.')}: ${e.message}`);
            return res.status(400).json({
                success: false,
                error: fieldErrors.join(', ') || 'Malformed input data',
                message: fieldErrors.join(', ') || 'Malformed input data',
                code: "VALIDATION_ERROR",
                validationDetails: err.errors.map(e => ({
                    path: e.path.join('.'),
                    message: e.message
                }))
            });
        }
        next(err);
    }
};

module.exports = validate;
