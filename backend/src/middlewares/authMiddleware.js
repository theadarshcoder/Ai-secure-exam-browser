const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; 
    if (!token) return res.status(401).json({ message: "Access Denied!" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user || user.currentSessionToken !== token) {
            return res.status(403).json({ message: "Session invalid or logged in elsewhere" });
        }
        req.user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ message: "Invalid Token!" });
    }
};

const checkRole = (requiredRole) => {
    return (req, res, next) => {
        if (req.user.role !== requiredRole && req.user.role !== 'admin') {
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

