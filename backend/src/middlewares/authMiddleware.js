const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Access Denied!" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(403).json({ message: "User account not found" });
        }

        // ✨ SINGLE-SESSION ENFORCEMENT: Anti-Login Sharing
        // If currentSessionToken is set but doesn't match this request token, reject it.
        if (user.currentSessionToken && user.currentSessionToken !== token) {
            return res.status(401).json({ 
                message: "Security Alert: This session has been terminated because you logged in from another device.",
                code: "SESSION_COLLISION" 
            });
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
        if (!roles.includes(req.user.role) && req.user.role !== 'admin') {
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

