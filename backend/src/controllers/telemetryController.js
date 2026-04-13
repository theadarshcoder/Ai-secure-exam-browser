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

    // Capture telemetry
    const log = new ErrorLog({
        userId,
        examId,
        errorType,
        message: message.substring(0, 1000), // Sanitize/Truncate message
        userAgent: userAgent || req.get('User-Agent'),
        deviceInfo,
        timestamp: new Date()
    });

    await log.save();

    console.log(`[TELEMETRY] ${userId} - ${errorType}: ${message.substring(0, 50)}...`);

    res.status(201).json({ success: true, message: 'Telemetry log recorded.' });
});
