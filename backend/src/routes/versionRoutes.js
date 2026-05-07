const express = require('express');
const router = express.Router();

/**
 * 🏷️ Version Endpoint
 * Returns platform versioning and basic uptime metadata.
 */
router.get('/', (req, res) => {
    res.json({
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: `${Math.floor(process.uptime())}s`,
        timestamp: new Date().toISOString(),
        buildInfo: {
            nodeVersion: process.version,
            platform: process.platform,
            gitSha: process.env.GIT_SHA || 'development',
            buildTime: process.env.BUILD_TIME || new Date().toISOString()
        }
    });
});

module.exports = router;
