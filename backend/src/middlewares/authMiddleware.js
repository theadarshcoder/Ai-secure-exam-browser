const jwt = require('jsonwebtoken');

// 1. Verify if user is logged in (Token Verify)
const verifyToken = (req, res, next) => {
    // Extract token from Header
    const token = req.headers.authorization?.split(" ")[1]; 

    if (!token) {
        return res.status(401).json({ message: "Access Denied! No token found." });
    }

    try {
        // Verify token with secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Add user data (id, role) to request object
        next(); // Proceed to next middleware/route
    } catch (error) {
        res.status(403).json({ message: "Invalid Token!" });
    }
};

// 2. RBAC: Role check function
const checkRole = (requiredRole) => {
    return (req, res, next) => {
        if (req.user.role !== requiredRole && req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: `You are a ${req.user.role}. Only ${requiredRole} can access this page!` 
            });
        }
        next();
    };
};

module.exports = { verifyToken, checkRole };
