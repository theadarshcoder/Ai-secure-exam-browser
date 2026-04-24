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
            // Security Fix: Strict session check (reject if token in DB is null/empty or mismatch)
            if (!user.currentSessionToken || user.currentSessionToken !== token) {
                return res.status(401).json({ 
                    message: "Session expired or terminated. Please login again.",
                    code: "SESSION_TERMINATED" 
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
        return res.status(403).json({
            message: "Authentication failed",
            code: "AUTH_FAILED"
        });
    }
};

const checkRole = (requiredRoles) => {
    return (req, res, next) => {
        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Access denied for ${req.user.role}. This route requires one of: ${roles.join(', ')}` });
        }
        next();
    };
};

const checkPermission = (requiredPermission) => {
    return (req, res, next) => {
        // ⚡ SCALING: Use permissions directly from the JWT-decoded user object
        // This avoids a database hit (User.findById) on every request.
        const { role, permissions } = req.user;

        if (role === 'admin') return next();
        
        if (permissions && permissions.includes(requiredPermission)) {
            return next();
        }

        return res.status(403).json({ 
            message: `Security: Missing required permission [${requiredPermission}]. Access Denied.`,
            code: "PERMISSION_DENIED"
        });
    };
};

module.exports = { verifyToken, checkRole, checkPermission };

