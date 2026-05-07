const helmet = require('helmet');

/**
 * 🛡️ Security Configuration (Helmet Upgrade)
 * Implements strict Content Security Policy, HSTS, and Frame Protection.
 */

const securityHeaders = helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            "default-src": ["'self'"],
            "script-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"], // Allow Swagger/Monaco
            "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            "img-src": ["'self'", "data:", "https://res.cloudinary.com"],
            "connect-src": ["'self'", "https://api.resend.com", "https://api.razorpay.com"],
            "font-src": ["'self'", "https://fonts.gstatic.com"],
            "object-src": ["'none'"],
            "media-src": ["'self'"],
            "frame-src": ["'self'"],
        },
    },
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
    },
    frameguard: {
        action: "deny", // Prevent clickjacking
    },
    xssFilter: true,
    noSniff: true,
    hidePoweredBy: true,
});

/**
 * 🧪 CSRF Protection (Simplified Tokenless approach for REST)
 * For higher security in multi-tenant, we enforce SameSite=Lax/Strict 
 * and validate the Origin/Referer for sensitive mutations.
 */
const csrfGuard = (req, res, next) => {
    const sensitiveMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (sensitiveMethods.includes(req.method)) {
        const origin = req.get('origin') || req.get('referer');
        const allowedOrigin = process.env.FRONTEND_URL;

        if (origin && !origin.includes(allowedOrigin) && process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'CSRF_BLOCKED',
                    message: 'Cross-origin request blocked for sensitive operation.'
                }
            });
        }
    }
    next();
};

module.exports = {
    securityHeaders,
    csrfGuard
};
