const mongoose = require('mongoose');
const { getRedisClient } = require('../config/redis');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { computeStudentIntelligence } = require('../services/intelligenceService');

// 🚀 Student Intelligence Dashboard Controller
// Now a thin layer: cache check → delegate to shared service → cache result

exports.getStudentIntelligence = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // 1. Validate early (before cache check)
    if (!mongoose.isValidObjectId(studentId)) {
        return res.status(400).json({ error: 'Invalid Student ID format' });
    }

    const redis = getRedisClient();
    const cacheKey = `student_intelligence:${studentId}:p${page}`;

    // 2. Check Redis Cache
    if (redis) {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            try {
                return res.json(JSON.parse(cachedData));
            } catch (err) {
                console.error('⚠️ Redis parse error in getStudentIntelligence:', err.message);
                // If parse fails, continue to fresh computation
            }
        }
    }

    // 3. Cache MISS → Compute using shared service (single source of truth)
    const response = await computeStudentIntelligence(studentId, page, limit);

    // 4. Cache the result for 5 minutes
    if (redis) {
        try {
            await redis.set(cacheKey, JSON.stringify(response), 'EX', 300);
        } catch (err) {
            console.warn('⚠️ Redis cache write failed:', err.message);
        }
    }

    res.json(response);
});
