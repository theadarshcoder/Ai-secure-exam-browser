const jwt = require('jsonwebtoken');
const User = require('../models/User'); 
const cacheService = require('../services/cacheService');
const NodeCache = require('node-cache');

// 🛡️ Fix 16: L1 In-Memory Cache (5s TTL to absorb thundering herd)
// 🛡️ Fix 1 (Last-Mile): useClones: false to avoid GC pressure on high churn
const l1Cache = new NodeCache({ stdTTL: 5, checkperiod: 10, useClones: false });
const inFlightRequests = new Map();

const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Access Denied!" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // 🛡️ Fix 16 (Upgraded): L1 Cache + Request Coalescing (Thundering Herd Protection)
        const l1Key = `auth_meta:${decoded.id}`;
        const cachedL1 = l1Cache.get(l1Key);

        if (cachedL1 && (!decoded.sessionVersion || cachedL1.sessionVersion === decoded.sessionVersion)) {
            req.user = { ...decoded, permissions: cachedL1.permissions };
            return next();
        }

        // Request Coalescing: If multiple requests for same user hit, reuse the first promise
        if (inFlightRequests.has(l1Key)) {
            const result = await inFlightRequests.get(l1Key);
            if (!decoded.sessionVersion || result.sessionVersion === decoded.sessionVersion) {
                req.user = { ...decoded, permissions: result.permissions };
                return next();
            }
        }

        const authTask = (async () => {
            let permissions = [];
            let cachedSession = null;
            
            try {
                cachedSession = await cacheService.getUserSession(decoded.id);
            } catch (cacheErr) {
                console.error('🛡️ L2 Cache Service Down:', cacheErr.message);
            }

            if (cachedSession && cachedSession.sessionVersion) {
                // L2 (Redis): Version-based validation (unified with L3)
                if (decoded.sessionVersion && cachedSession.sessionVersion > decoded.sessionVersion) {
                    throw new Error('SESSION_COLLISION'); // Token is older than cache -> revoked!
                } else if (decoded.sessionVersion && cachedSession.sessionVersion < decoded.sessionVersion) {
                    // Cache is stale! The token is newer (e.g. recent login). Fall back to DB to confirm.
                    cachedSession = null; 
                } else {
                    permissions = cachedSession.permissions || [];
                }
            } 
            
            if (!cachedSession || !cachedSession.sessionVersion) {
                // L3: Fallback to MongoDB
                const user = await User.findById(decoded.id).select('permissions sessionVersion');
                if (!user) throw new Error('USER_NOT_FOUND');
                
                // Session Versioning check
                if (decoded.sessionVersion && user.sessionVersion !== decoded.sessionVersion) {
                    throw new Error('STALE_SESSION');
                }
                permissions = user.permissions || [];

                // Backfill L2 cache for next request
                try {
                    await cacheService.saveUserSession(decoded.id, user.sessionVersion, permissions);
                } catch (_) { /* non-critical */ }
            }

            const result = { sessionVersion: decoded.sessionVersion, permissions };
            l1Cache.set(l1Key, result);
            return result;
        })();

        inFlightRequests.set(l1Key, authTask);
        try {
            const authResult = await authTask;
            req.user = { ...decoded, permissions: authResult.permissions };
            next();
        } catch (err) {
            if (err.message === 'SESSION_COLLISION') {
                return res.status(401).json({ 
                    message: "Security Alert: This session has been terminated because you logged in from another device.",
                    code: "SESSION_COLLISION" 
                });
            } else if (err.message === 'STALE_SESSION') {
                return res.status(401).json({ 
                    message: "Security: This session is no longer valid. Your account was logged in elsewhere.",
                    code: "STALE_SESSION" 
                });
            } else if (err.message === 'USER_NOT_FOUND') {
                return res.status(403).json({ message: "User account not found" });
            }
            throw err; // Let outer catch handle it
        } finally {
            inFlightRequests.delete(l1Key);
        }
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
        // ⚡ SCALING: Permissions are attached to req.user by verifyToken (via Redis or DB)
        // This keeps the JWT payload small and allows real-time permission updates.
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

