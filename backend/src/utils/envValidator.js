// ─────────────────────────────────────────────────────────
// envValidator.js — Startup check for required variables
// ─────────────────────────────────────────────────────────

/**
 * Validates that essential environment variables are present.
 * Distinguishes between FATAL (required) and WARNING (recommended) variables.
 */
const validateEnv = () => {
    const required = [
        'JWT_SECRET',
        'MONGODB_URI'
    ];

    const recommended = [
        'REDIS_URL'
    ];

    const missingRequired = required.filter(envVar => !process.env[envVar]);
    const missingRecommended = recommended.filter(envVar => !process.env[envVar]);

    if (missingRequired.length > 0) {
        console.error('\n❌ CRITICAL ERROR: Missing Required Environment Variables:');
        missingRequired.forEach(v => console.error(`   - ${v}`));
        console.error('\nServer cannot start without these. Please update your environment settings.\n');
        process.exit(1);
    }

    if (missingRecommended.length > 0) {
        console.warn('\n⚠️  WARNING: Missing Recommended Environment Variables:');
        missingRecommended.forEach(v => console.warn(`   - ${v}`));
        console.warn('The application will run, but some features (like caching/resilience) will be disabled.\n');
    } else {
        console.log('✅ Environment check: All essential variables are set.');
    }
};

module.exports = validateEnv;
