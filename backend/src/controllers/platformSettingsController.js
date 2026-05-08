const GlobalSettings = require('../models/GlobalSettings');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { getRedisClient } = require('../config/redis');
const AuditLog = require('../models/AuditLog');

/**
 * ⚙️ Get current platform settings
 */
exports.getSettings = asyncHandler(async (req, res) => {
    const settings = await GlobalSettings.getSettings();
    res.json(settings);
});

/**
 * 🔒 Update platform mode (active, readonly, maintenance, locked)
 */
exports.updateMode = asyncHandler(async (req, res) => {
    const { mode, reason } = req.body;
    if (!['active', 'readonly', 'maintenance', 'locked'].includes(mode)) {
        res.status(400);
        throw new Error('Invalid platform mode');
    }

    const settings = await GlobalSettings.getSettings();
    const oldMode = settings.platformMode;

    if (oldMode === mode) {
        return res.json(settings);
    }

    settings.platformMode = mode;
    settings.history.push({
        updatedBy: req.user.id,
        oldValue: { platformMode: oldMode },
        newValue: { platformMode: mode },
        reason: reason || 'Mode updated from dashboard'
    });
    settings.updatedBy = req.user.id;

    await settings.save();

    // ⚡ Sync with Redis Cache immediately
    const redis = getRedisClient();
    await redis.set('platform:mode', mode, 'EX', 60);

    // 📢 Broadcast Mode Change via Socket.io
    const io = req.app.get('io');
    if (io) {
        io.emit('platform_mode_change', { mode, reason });
    }

    // 📜 Audit Log
    await AuditLog.create({
        performedBy: req.user.id,
        action: 'UPDATE_PLATFORM_MODE',
        severity: mode === 'active' ? 'info' : 'critical',
        actorRole: 'super_admin',
        details: { oldMode, newMode: mode, reason }
    });

    res.json(settings);
});

/**
 * 📢 Update platform-wide announcement
 */
exports.updateAnnouncement = asyncHandler(async (req, res) => {
    const { title, message, isActive, target } = req.body;
    
    const settings = await GlobalSettings.getSettings();
    settings.announcement = { title, message, isActive, target };
    
    await settings.save();

    // Broadcast via Socket.IO if active
    if (isActive) {
        const io = req.app.get('io');
        const broadcastData = {
            id: Date.now(),
            type: 'announcement',
            title,
            message,
            timestamp: new Date()
        };

        if (target === 'all') {
            io.emit('platform_announcement', broadcastData);
        } else {
            io.to(`role_${target}`).emit('platform_announcement', broadcastData);
        }
    }

    res.json(settings);
});

/**
 * 🌐 Get Public Platform Status (Unauthenticated)
 */
exports.getPublicStatus = asyncHandler(async (req, res) => {
    const settings = await GlobalSettings.getSettings();
    
    // Only return non-sensitive fields
    res.json({
        platformMode: settings.platformMode,
        announcement: settings.announcement?.isActive ? settings.announcement : null
    });
});
