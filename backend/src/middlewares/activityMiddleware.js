const User = require('../models/User');

/**
 * 🛰️ Activity Tracking Middleware
 * Updates the 'lastActiveAt' timestamp for authenticated users.
 * To optimize performance, it only writes to DB if the last update was > 5 minutes ago.
 */
const activityTracker = async (req, res, next) => {
    if (!req.user || !req.user.id) {
        return next();
    }

    try {
        const FIVE_MINUTES = 5 * 60 * 1000;
        const now = new Date();
        
        // Check if we should update (optimization)
        // Note: req.user usually comes from JWT, so we might need a quick DB check or trust a session field
        // For simplicity and correctness, we'll do a conditional update
        
        await User.updateOne(
            { 
                _id: req.user.id, 
                $or: [
                    { lastActiveAt: { $lt: new Date(now - FIVE_MINUTES) } },
                    { lastActiveAt: { $exists: false } }
                ]
            },
            { $set: { lastActiveAt: now } }
        );

        next();
    } catch (error) {
        console.error('🛰️ Activity Tracker Error:', error);
        next(); // Silent failure to avoid blocking requests
    }
};

module.exports = { activityTracker };
