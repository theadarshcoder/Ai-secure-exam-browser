const ErrorLog = require('../models/ErrorLog');
const { asyncHandler } = require('../middlewares/errorMiddleware');

/**
 * 📊 Log Telemetry Error
 * Records proctoring or hardware failures for diagnostics.
 */
exports.logError = asyncHandler(async (req, res) => {
    const { examId, errorType, message, userAgent, deviceInfo } = req.body;
    const userId = req.user.id;

    if (!examId || !errorType || !message) {
        res.status(400);
        throw new Error('examId, errorType, and message are required.');
    }

    const { pushTelemetryLog } = require('../services/cacheService');

    // Capture telemetry and format for buffer
    const logData = {
        userId,
        examId,
        errorType,
        message: message.substring(0, 1000), // Sanitize/Truncate message
        userAgent: userAgent || req.get('User-Agent'),
        deviceInfo,
        timestamp: new Date()
    };

    // ⚡ Fast Push to Redis Buffer instead of direct DB write
    await pushTelemetryLog(logData);

    // console.log(`[TELEMETRY] Buffered ${userId} - ${errorType}: ${message.substring(0, 50)}...`);

    res.status(201).json({ success: true, message: 'Telemetry log buffered.' });
});
