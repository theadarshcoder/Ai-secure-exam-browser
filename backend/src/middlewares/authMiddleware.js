const jwt = require('jsonwebtoken');
const User = require('../models/User'); 
const cacheService = require('../services/cacheService');

const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Access Denied!" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // ⚡ SCALING GUARD: Check Redis first
        let cachedToken = null;
        try {
            cachedToken = await cacheService.getUserSession(decoded.id);
        } catch (cacheErr) {
            console.error('🛡️ Cache Service Down (verifyToken):', cacheErr.message);
            // 🔄 Fallback to MongoDB automatically by leaving cachedToken as null
        }

        if (cachedToken) {
            if (cachedToken !== token) {
                return res.status(401).json({ 
                    message: "Security Alert: This session has been terminated because you logged in from another device.",
                    code: "SESSION_COLLISION" 
                });
            }
        } else {
            // 🔄 CACHE MISS / REDIS DOWN: Fetch from DB & Backfill
            const user = await User.findById(decoded.id);
            if (!user) {
                return res.status(403).json({ message: "User account not found" });
            }
            if (user.currentSessionToken && user.currentSessionToken !== token) {
                return res.status(401).json({ 
                    message: "Security Alert: This session has been terminated because you logged in from another device.",
                    code: "SESSION_COLLISION" 
                });
            }
            // Backfill cache (Non-blocking)
            cacheService.saveUserSession(decoded.id, token).catch(e => 
                console.error('🛡️ Cache Backfill Failed:', e.message)
            );
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(403).json({
                message: "Session expired. Please login again.",
                code: "TOKEN_EXPIRED"
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({
                message: "Invalid authentication token",
                code: "INVALID_TOKEN"
            });
        }
        res.status(403).json({
            message: "Authentication failed",
            code: "AUTH_FAILED"
        });
    }
};

const checkRole = (requiredRoles) => {
    return (req, res, next) => {
        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        if (!roles.includes(req.user.role) && req.user.role !== 'admin' && req.user.role !== 'super_mentor') {
            return res.status(403).json({ message: `Access denied for ${req.user.role}` });
        }
        next();
    };
};

const checkPermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            const user = await User.findById(req.user.id);
            if (user.role === 'admin') return next();
            if (user.permissions && user.permissions.includes(requiredPermission)) return next();
            return res.status(403).json({ message: `Missing permission: ${requiredPermission}` });
        } catch (error) {
            res.status(500).json({ error: "Permission check failed" });
        }
    };
};

module.exports = { verifyToken, checkRole, checkPermission };

