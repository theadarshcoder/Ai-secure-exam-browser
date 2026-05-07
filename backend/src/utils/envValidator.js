const { z } = require('zod');
const logger = require('./logger');

/**
 * 🛡️ Enterprise Environment Validator
 * Uses Zod to strictly validate environment variables on startup.
 * Prevents "undefined" runtime errors in production.
 */

const envSchema = z.object({
    // Core Infrastructure
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).default('5001'),
    MONGODB_URI: z.string().url(),
    REDIS_URL: z.string().url(),

    // Security & Auth
    JWT_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    ELECTRON_SECRET: z.string().min(16),

    // Application URL
    FRONTEND_URL: z.string(),

    // Third Party (Optional but warned if missing in production)
    SENTRY_DSN: z.string().url().optional(),
    RESEND_API_KEY: z.string().optional(),
    RAZORPAY_KEY_ID: z.string().optional(),
    RAZORPAY_KEY_SECRET: z.string().optional(),

    // AI & Services
    GEMINI_API_KEY: z.string().optional(),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
});

const validateEnv = () => {
    try {
        const parsed = envSchema.safeParse(process.env);

        if (!parsed.success) {
            console.error('\n❌ [CRITICAL] Invalid Environment Configuration:');
            parsed.error.errors.forEach((err) => {
                console.error(`   - ${err.path.join('.')}: ${err.message}`);
            });
            console.error('\n');
            process.exit(1);
        }

        // Production Readiness Warnings
        if (process.env.NODE_ENV === 'production') {
            const criticalMissing = [];
            if (!process.env.SENTRY_DSN) criticalMissing.push('SENTRY_DSN');
            if (!process.env.RESEND_API_KEY) criticalMissing.push('RESEND_API_KEY');
            if (!process.env.RAZORPAY_KEY_ID) criticalMissing.push('RAZORPAY_KEY_ID');

            if (criticalMissing.length > 0) {
                logger.warn({ missing: criticalMissing }, '⚠️  [PRODUCTION WARNING] Missing essential SaaS production keys');
            }
        }

        return parsed.data;
    } catch (err) {
        console.error('❌ Environment validation logic failed:', err.message);
        process.exit(1);
    }
};

module.exports = validateEnv;
