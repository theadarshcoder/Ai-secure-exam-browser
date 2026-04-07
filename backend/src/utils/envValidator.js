// ─────────────────────────────────────────────────────────
// envValidator.js — Startup check for required variables
// ─────────────────────────────────────────────────────────

const requiredEnvVars = [
    'JWT_SECRET',
    'MONGODB_URI',
    'REDIS_URL'
];

const validateEnv = () => {
    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

    if (missing.length > 0) {
        console.error('\n❌ CRITICAL ERROR: Missing Required Environment Variables:');
        missing.forEach(v => console.error(`   - ${v}`));
        console.error('\nPlease update your .env file and restart the server.\n');
        process.exit(1);
    }

    console.log('✅ Environment check: All required variables are set.');
};

module.exports = validateEnv;
