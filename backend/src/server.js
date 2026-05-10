// ═══════════════════════════════════════════════════════════
//  server.js — Main Backend Server (Enterprise Security)
// ═══════════════════════════════════════════════════════════

const express = require('express');
const http = require('http');
const crypto = require('crypto');
const cors = require('cors');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db.js');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { verifyToken, checkRole, checkPermission } = require('./middlewares/authMiddleware');
const { checkInstitutionActive } = require('./middlewares/institutionMiddleware');
const User = require('./models/User');
const Exam = require('./models/Exam');
const ExamSession = require('./models/ExamSession');
const Setting = require('./models/Setting');
const { connectRedis, getRedisClient, redisUrl, createNewConnection } = require('./config/redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const IORedis = require('ioredis');
const { RedisStore } = require('rate-limit-redis');
const cacheService = require('./services/cacheService');
const validateEnv = require('./utils/envValidator');
const { startHealthMonitor, incrementDisconnect } = require('./services/healthMonitor');
const logger = require('./utils/logger');
const { initSentry, Sentry } = require('./utils/sentry');

const { startLagMonitor, getMetrics } = require('./utils/monitor');
startLagMonitor();

const helmet = require('helmet');
const compression = require('compression');
const timeout = require('connect-timeout');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');

const { VIOLATION_TYPES, SESSION_STATUS } = require('./utils/constants');
const { LRUCache } = require('lru-cache');

// ─── Route Imports ───────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const examRoutes = require('./routes/examRoutes');
const adminRoutes = require('./routes/adminRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const adminOpsRoutes = require('./routes/adminOpsRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const aiRoutes = require('./routes/aiRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const publicRoutes = require('./routes/publicRoutes');
const billingRoutes = require('./routes/billingRoutes');
const aiMonitoringRoutes = require('./routes/aiMonitoringRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const { setupCodeEvaluationWorker } = require('./queues/codeGradingQueue');
const { setupFrontendEvaluationWorker } = require('./queues/frontendGradingQueue');
const { setupNotificationWorker } = require('./queues/notificationQueue');
const { setupBillingWorker } = require('./queues/billingWorker');
const { startIntelligenceWorker } = require('./queues/intelligenceWorker');
const { startAutoSubmitWorker } = require('./queues/autoSubmitWorker');
const { 
    inviteVerifyLimiter, 
    authLimiter, 
    billingLimiter, 
    aiLimiter, 
    uploadLimiter, 
    publicLimiter, 
    globalLimiter 
} = require('./middlewares/rateLimiter');
const traceMiddleware = require('./middlewares/traceMiddleware');
const { platformModeMiddleware } = require('./middlewares/platformMiddleware');
const { securityHeaders, csrfGuard } = require('./middlewares/securityMiddleware');
const responseStandardizer = require('./middlewares/responseMiddleware');
const { activityTracker } = require('./middlewares/activityMiddleware');
const { 
    httpRequestsTotal, 
    httpRequestDuration, 
    wsActiveConnections,
    activeExamsGauge 
} = require('./utils/metrics');

const healthRoutes = require('./routes/healthRoutes');
const versionRoutes = require('./routes/versionRoutes');
const setupSwagger = require('./config/swagger');
const { featureFlagGuard, isEnabled } = require('./utils/featureFlags');

const app = express();

// 🛰️ Initialize Sentry Tracking
initSentry(app);

// 📖 [STEP 5] Setup Swagger API Documentation
setupSwagger(app);

// Sentry v10+ automatic instrumentation handles request tracing if initialized correctly
// No longer need Handlers.requestHandler() or tracingHandler()

app.set('trust proxy', 1);

// 🛡️ [STEP 5] Maintenance Mode Global Guard
app.use((req, res, next) => {
    if (isEnabled('MAINTENANCE_MODE') && !req.path.startsWith('/health') && !req.path.startsWith('/admin')) {
        return res.status(503).json({
            success: false,
            error: {
                code: 'MAINTENANCE_MODE',
                message: 'System is currently undergoing maintenance. Please check back later.'
            }
        });
    }
    next();
});
const server = http.createServer(app);

// Keep track of active workers for graceful shutdown
const workers = [];

app.use(securityHeaders);
app.use(csrfGuard);
app.use(compression());
app.use(timeout('45s'));
app.use(traceMiddleware); // Generate Request IDs & Initialize Context
app.use(responseStandardizer); // Standardize all responses

// 🛡️ [STEP 1] Request Logging Middleware (Start & Finish)
app.use((req, res, next) => {
    const start = Date.now();
    const { method, path } = req;

    // Attach request-scoped child logger
    req.log = logger.child({ 
        requestId: req.requestId,
        path,
        method 
    });

    // Log request start
    req.log.info({ type: 'request_start' }, `🚀 ${method} ${path}`);

    // Capture response finish to log duration and status
    res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 500 ? 'error' : (res.statusCode >= 400 ? 'warn' : 'info');
        const env = process.env.NODE_ENV || 'development';

        // 📊 [STEP 2] Record Metrics
        httpRequestsTotal.inc({ method, path, status: res.statusCode, env });
        httpRequestDuration.observe({ method, path, env }, duration);
        
        req.log[level]({
            type: 'request_finish',
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            requestId: req.requestId
        }, `🏁 ${method} ${path} - ${res.statusCode} (${duration}ms)`);
    });

    next();
});

// 🧠 [STEP 1] Post-Auth Context Middleware
// This will be called after verifyToken in routes to backfill userId/institutionId into the context
app.use((req, res, next) => {
    if (req.user) {
        const { storage } = require('./utils/asyncStorage');
        const context = storage.getStore();
        if (context) {
            context.userId = req.user.id;
            context.institutionId = req.user.institutionId;
            // Also update req.log to include these
            req.log = req.log.child({ 
                userId: req.user.id, 
                institutionId: req.user.institutionId 
            });
        }
    }
    next();
});


// ═══════════════════════════════════════════════════════════
//  🔒 SECURITY 1: Strict CORS Setup
// ═══════════════════════════════════════════════════════════
// Previous: app.use(cors()) allowed any domain (Insecure!)
// Now: Only authorized frontend origins are permitted.
//
// Configure FRONTEND_URL in .env:
//   Development: http://localhost:5173
//   Production:  https://your-app-domain.com
//
// Multiple URLs can be comma-separated:
//   FRONTEND_URL=http://localhost:5173,https://app.proctoshield.com



// 🛡️ Fix 31: All origins must be exact matches to prevent PaaS subdomain takeover
const allowedOrigins = new Set(
    process.env.FRONTEND_URL 
        ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
        : ['http://localhost:5173']
);

if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.add('http://127.0.0.1:5173');
    allowedOrigins.add('http://localhost:5174');
    allowedOrigins.add('http://localhost:5175');
}

// 🚀 [STEP 2] Mount Health & Version Routes
app.use('/health', healthRoutes);
app.use('/version', versionRoutes);

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.has(origin)) {
            callback(null, true);
        } else {
            logger.warn(`🚫 CORS blocked: ${origin}`);
            callback(new Error('CORS policy: Not allowed.'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id']
};

app.use(cors(corsOptions));

// 🚀 [PHASE 4] Readiness Flag
let isReady = false;

// 🚀 [PHASE 4] Health Check Endpoint (For Load Balancers/K8s)
app.get('/health', (req, res) => {
    if (!isReady) return res.status(503).json({ status: 'Not Ready', uptime: process.uptime() });
    res.json({ 
        status: 'UP', 
        timestamp: new Date(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// ─── ⚓ WEBHOOKS (MUST BE BEFORE express.json) ───────
const webhookController = require('./controllers/webhookController');
app.post('/api/billing/webhook/razorpay', express.raw({ type: 'application/json' }), webhookController.handleRazorpayWebhook);

// ─── JSON Parsers ───────────────────────────────────────
app.use('/api/exams/save-progress', express.json({ limit: '2mb' }));
app.use(express.json({ limit: '100kb' }));
app.use(mongoSanitize()); // Prevent NoSQL Injection attacks

function isAllowedOrigin(origin) {
    if (!origin) return true;

    if (allowedOrigins.has(origin)) {
        return true;
    }

    try {
        const { hostname } = new URL(origin);
        return hostname === 'localhost'
            || hostname === '127.0.0.1'
            || hostname.endsWith('.pages.dev');
    } catch (_err) {
        return false;
    }
}


// ═══════════════════════════════════════════════════════════
//  🛡️ SECURITY 2: Rate Limiting (Brute-Force Protection)
// ═══════════════════════════════════════════════════════════
// Mitigate brute-force and DDoS attacks by limiting request rates.

// 🛡️ [STEP 5] Rate Limiters moved to centralized middleware
const telemetryLimiter = publicLimiter; 
const autoSaveLimiter = globalLimiter;

// Global limiter definition is above. 
// We will apply it route-wise below to avoid blocking the save-progress endpoint.


// ═══════════════════════════════════════════════════════════
//  🔌 SECURITY 3: Socket.IO with JWT Authentication
// ═══════════════════════════════════════════════════════════
// Previous: Anyone could connect to the socket and listen to alerts (Critical Vulnerability!)
// Now: Only users with a valid JWT can establish a connection.

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (isAllowedOrigin(origin)) {
                callback(null, true);
            } else {
                console.warn(`🚫 Socket CORS blocked: ${origin}`);
                callback(new Error('CORS policy: Not allowed.'));
            }
        },
        methods: ['GET', 'POST'],
        credentials: true
    },
    perMessageDeflate: {
        threshold: 1024 // Only compress payloads larger than 1KB
    }
});

// 🛡️ Pass io to app for global access (Avoids circular dependency)
app.set('socketio', io);

// ─── Socket.IO Redis Adapter (Cluster Mode Fix) ────────────
// PM2 Cluster mein har worker ka alag Socket.io instance hota hai.
// Bina Redis Adapter ke, agar student Worker-1 par connected hai
// aur event Worker-2 se emit hota hai, toh student ko event NAHI milega.
// Redis Pub/Sub is gap ko bridge karta hai — sabhi workers ek broadcast receive karte hain.
// Redis Pub/Sub is gap ko bridge karta hai — sabhi workers ek broadcast receive karte hain.
try {
    const pubClient = getRedisClient();
    const subClient = createNewConnection(); // Cluster compatibility fix
    io.adapter(createAdapter(pubClient, subClient));
    logger.info('🔗 [Socket.IO] Redis Adapter active — Cluster broadcasting enabled');
} catch (adapterErr) {
    logger.warn({ err: adapterErr.message }, '⚠️  [Socket.IO] Redis Adapter failed, falling back to in-memory (single instance only)');
}

// Expose Socket.IO instance to routes/controllers globally
app.set('io', io);

// ─── Auth Middleware & Handlers Logic stays here ───
// ...

// Verify JWT token before connection
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token
            || socket.handshake.headers?.authorization?.split(' ')[1];

        if (!token) {
            logger.warn('[Socket Auth] Connection rejected: Token missing');
            return next(new Error('Authentication required! Token missing.'));
        }

        // 🛡️ Phase 1 Fix: Verify with JWT_SECRET (Access Token)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // ⚡ SCALING GUARD: Check Redis first (Cache Hit = 0 DB Hits)
        const cachedSession = await cacheService.getUserSession(decoded.id);

        if (cachedSession && cachedSession.sessionVersion) {
            if (decoded.sessionVersion && cachedSession.sessionVersion !== decoded.sessionVersion) {
                logger.warn({ email: decoded.email }, `[Socket Auth] Stale session for ${decoded.email}. Force disconnecting.`);
                return next(new Error('Session terminated! You logged in from another device.'));
            }
            if (cachedSession.status === 'suspended' || cachedSession.status === 'trial_expired' || cachedSession.status === 'payment_failed') {
                return next(new Error(`Institution ${cachedSession.status.replace('_', ' ')}.`));
            }
            
            socket.user = {
                id: decoded.id,
                email: decoded.email,
                role: cachedSession.role || decoded.role,
                institutionId: cachedSession.institutionId || null
            };
            logger.debug({ email: decoded.email }, `[SCALING] Socket Auth: Redis Cache Hit for ${decoded.email}`);
        } else {
            // 🔄 CACHE MISS: Fallback to MongoDB & Backfill
            logger.info({ email: decoded.email }, `[SCALING] Socket Auth: Redis Cache Miss for ${decoded.email}. Fetching from DB.`);
            const user = await User.findById(decoded.id).lean();
            if (!user) {
                logger.warn({ userId: decoded.id }, `[Socket Auth] User not found: ${decoded.id}`);
                return next(new Error('User account no longer exists.'));
            }
            if (user.status === 'suspended' || user.status === 'trial_expired' || user.status === 'payment_failed') {
                return next(new Error(`Institution ${user.status.replace('_', ' ')}.`));
            }
            // Validate sessionVersion against DB
            if (decoded.sessionVersion && user.sessionVersion !== decoded.sessionVersion) {
                logger.warn({ email: decoded.email }, `[Socket Auth] Stale session version for ${decoded.email}.`);
                return next(new Error('Session terminated! You logged in from another device.'));
            }
            
            socket.user = {
                id: decoded.id,
                email: decoded.email,
                role: user.role,
                institutionId: user.institutionId || null
            };

            // Backfill cache with full context
            await cacheService.saveUserSession(decoded.id, {
                sessionVersion: user.sessionVersion,
                permissions: user.permissions || [],
                role: user.role,
                institutionId: user.institutionId,
                status: user.status
            });
        }

        socket.expiresAt = decoded.exp * 1000;

        // 🛡️ Ensure user room join immediately after auth
        socket.join(`user_${decoded.id}`);

        logger.info({ email: decoded.email }, `[Socket Auth] Success: ${decoded.email} joined user_${decoded.id}`);
        next();

    } catch (error) {
        logger.warn({ err: error.message }, `[Socket Auth] Failed: ${error.message}`);
        // Return generic error to client but log specific error internally
        const genericMsg = error.name === 'TokenExpiredError' 
            ? 'Session expired. Please login again.' 
            : 'Authentication failed. Please login again.';
        next(new Error(genericMsg));
    }
});


// 🛡️ Removed: Scattered IIFE startup logic

app.get('/', (req, res) => res.send('<h1>Server & Sockets working perfectly</h1>'));

// Auth routes — Rate limiter EXTRA tight
app.use('/api/auth/verify-invite', inviteVerifyLimiter);
// ─── Bull Board Dashboard ────────────────────────────────
const { codeEvaluationQueue } = require('./queues/codeGradingQueue');
const { frontendEvaluationQueue } = require('./queues/frontendGradingQueue');
const { notificationQueue } = require('./queues/notificationQueue');
const { intelligenceQueue } = require('./queues/intelligenceQueue');
const { autoSubmitQueue } = require('./queues/autoSubmitWorker');
const { billingQueue } = require('./queues/billingQueue');
const { DLQ_NAME } = require('./utils/queueHardening');
const { Queue } = require('bullmq');

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(codeEvaluationQueue),
    new BullMQAdapter(frontendEvaluationQueue),
    new BullMQAdapter(notificationQueue),
    new BullMQAdapter(intelligenceQueue),
    new BullMQAdapter(autoSubmitQueue),
    new BullMQAdapter(billingQueue),
    new BullMQAdapter(new Queue(DLQ_NAME, { connection: getRedisClient() }))
  ],
  serverAdapter: serverAdapter,
});

// 🛡️ [STEP 4] Protect Bull Board with Super Admin Role
app.use('/admin/queues', verifyToken, checkRole(['super_admin']), serverAdapter.getRouter());

// ─── 🚀 [STEP 5] API V1 Versioning Foundation ──────────────────
const v1Router = express.Router();

v1Router.use('/auth', authLimiter, platformModeMiddleware, authRoutes);
v1Router.use('/exams/save-progress', verifyToken, platformModeMiddleware, activityTracker, autoSaveLimiter);
v1Router.use('/exams', verifyToken, platformModeMiddleware, activityTracker, checkInstitutionActive, examRoutes);
v1Router.use('/admin', verifyToken, platformModeMiddleware, activityTracker, checkInstitutionActive, globalLimiter, adminRoutes);
v1Router.use('/admin/ops', verifyToken, checkRole(['super_admin']), adminOpsRoutes);
v1Router.use('/super-admin', verifyToken, platformModeMiddleware, activityTracker, checkRole(['super_admin']), globalLimiter, superAdminRoutes); 
v1Router.use('/session', verifyToken, platformModeMiddleware, activityTracker, checkInstitutionActive, telemetryLimiter, sessionRoutes);
v1Router.use('/ai', featureFlagGuard('AI_ENABLED'), verifyToken, platformModeMiddleware, activityTracker, checkInstitutionActive, globalLimiter, aiRoutes);
v1Router.use('/upload', verifyToken, platformModeMiddleware, activityTracker, checkInstitutionActive, globalLimiter, uploadRoutes);
v1Router.use('/public', globalLimiter, publicRoutes);
v1Router.use('/billing', featureFlagGuard('BILLING_ENABLED'), platformModeMiddleware, billingRoutes);
v1Router.use('/ai-monitoring', verifyToken, platformModeMiddleware, aiMonitoringRoutes);
v1Router.use('/analytics', verifyToken, platformModeMiddleware, analyticsRoutes);

// Mount V1 Router
app.use('/api/v1', v1Router);

// Maintain Legacy /api for Backward Compatibility (Internal use)
app.use('/api', v1Router);

// ─── 404 Global Handler ──────────────────────────────────
app.use((req, res, next) => {
    res.status(404).json({ 
        success: false, 
        error: {
            code: 'NOT_FOUND',
            message: 'Endpoint Not Found. Are you lost?',
            requestId: req.requestId
        }
    });
});

// ─── ERROR Global Handler ────────────────────────────────
const { errorHandler } = require('./middlewares/errorMiddleware');
app.use(errorHandler);




// Only authenticated users reach here
io.on('connection', (socket) => {
    logger.info({ socketId: socket.id, email: socket.user.email }, `Connected: ${socket.id} | User: ${socket.user.email}`);
    
    // 📊 [STEP 2] WebSocket Metrics
    wsActiveConnections.inc({ env: process.env.NODE_ENV || 'development' });

    socket.on('disconnect', () => {
        wsActiveConnections.dec({ env: process.env.NODE_ENV || 'development' });
        logger.info({ socketId: socket.id, email: socket.user?.email }, `Disconnected: ${socket.id}`);
    });
    
    // Join global role-specific and user-specific rooms for targeted broadcasting
    socket.join(`role_${socket.user.role}`);
    
    if (socket.user.role === 'super_admin') {
        socket.join('super_admin_global');
    } else {
        // Tenant isolated rooms
        socket.join(`inst_${socket.user.institutionId}`); // Global room for all users of this college
        socket.join(`inst_${socket.user.institutionId}_${socket.user.role}`); // Specific role room
    }
    socket.join(`user_${socket.user.id}`);

    // 🛡️ Fix 41 (Performance): RAM Leak Cleanup
    // Upgraded to Windowed Counting (20 events / 5 sec) with explicit Map cleanup
    const eventCounts = new Map();
    const isRateLimited = (eventName, limit = 20, windowMs = 5000) => {
        const now = Date.now();
        const data = eventCounts.get(eventName) || { count: 0, firstEvent: now };
        
        if (now - data.firstEvent > windowMs) {
            // 🛡️ Explicitly delete old keys to prevent Map growth
            if (eventCounts.size > 100) eventCounts.clear(); 
            data.count = 1;
            data.firstEvent = now;
        } else {
            data.count++;
        }
        
        eventCounts.set(eventName, data);
        if (data.count > limit) {
            logger.warn({ eventName, email: socket.user?.email }, `[Socket Spam] Event '${eventName}' throttled for user ${socket.user?.email}`);
            socket.emit('error', { message: 'Too many requests. Please slow down.' });
            return true;
        }
        return false;
    };

    // --- 🛡️ Silent Re-Authentication (Bug Fix 5) ---
    // 🏎️ Fix 23: Offload CPU-heavy JWT verify to non-blocking callback
    socket.on('re_auth', (token) => {
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                logger.warn(`Socket re-auth failed for ${socket.id}: ${err.message}`);
                return;
            }

            logger.info(`[SCALING] Socket Re-Auth: ${decoded.email}`);
            socket.user = { id: decoded.id, email: decoded.email, role: decoded.role };
            socket.expiresAt = decoded.exp * 1000;

            if (watchdogTimer) {
                clearTimeout(watchdogTimer);
                const newRemaining = socket.expiresAt - Date.now();
                if (newRemaining > 0) {
                    watchdogTimer = setTimeout(() => {
                        socket.emit('session_expired', { message: 'Security: Your session has expired. Please login again.' });
                        socket.disconnect(true);
                    }, newRemaining);
                }
            }
        });
    });

    // --- 🛡️ Session Watchdog (Token Expiry Check) ---
    const remainingTime = socket.expiresAt - Date.now();
    let watchdogTimer = null;

    if (remainingTime > 0) {
        watchdogTimer = setTimeout(() => {
            logger.warn({ email: socket.user.email }, `Socket Session Expired: ${socket.user.email}. Force disconnecting.`);
            socket.emit('session_expired', { message: 'Security: Your session has expired. Please login again to continue.' });
            socket.disconnect(true);
        }, remainingTime);
    } else {
        // Technically this shouldn't happen as io.use should catch it, but as a fail-safe:
        socket.disconnect(true);
    }

    socket.on('student_violation', async (data) => {
        if (isRateLimited('student_violation', 3000)) return;
        
        if (socket.expiresAt && Date.now() > socket.expiresAt) {
            socket.emit('session_expired', { message: 'Session expired. Please re-authenticate.' });
            return socket.disconnect(true);
        }

        if (socket.user.role !== 'student') {
            return socket.emit('error', { message: 'Only students can report violations.' });
        }

        // 🛡️ Fix Bug 2: All violations now pass through the Rule Engine
        // This ensures student_violation also triggers auto-blocking
        await handleViolationEngine(socket, data);
    });

    socket.on('violation_report', async (data) => {
        if (isRateLimited('violation_report', 3000)) return;
        await handleViolationEngine(socket, data);
    });

    // 🛡️ Consistently Unified Rule Engine Function
    async function handleViolationEngine(socket, data) {
        const { examId, type, duration, severity, details } = data;
        const studentId = socket.user.id;

        try {
            // 🛡️ Optimized: Use cached settings to prevent DB read-storms
            let settings = await cacheService.getCache('global_settings');
            if (!settings) {
                logger.info('📡 Cache miss: Fetching global settings from DB...');
                settings = await Setting.findOne() || new Setting();
                await cacheService.setCache('global_settings', settings, 86400); // Cache for 24h
            }
            const maxViolations = settings.maxViolations || 5;
            const bgLimit = settings.backgroundLimitSeconds || 10;

            let shouldBlock = false;
            let blockReason = '';
            let updatePayload = { 
                $push: { violations: { timestamp: new Date() } }, 
                $inc: { violationCount: 1 } 
            };

            // Mapping raw violation types to standardized ones
            if (type === 'TAB_HIDDEN' || type === VIOLATION_TYPES.TAB_SWITCH) {
                // Standardize all background events as TAB_SWITCH for the violation log
                updatePayload.$push.violations.type = VIOLATION_TYPES.TAB_SWITCH;
                updatePayload.$push.violations.severity = 'low';
                updatePayload.$push.violations.details = details || `Background duration: ${duration}s`;
                updatePayload.$inc.tabSwitchCount = 1;

                if (duration > bgLimit) {
                    shouldBlock = true;
                    blockReason = `Background limit exceeded (${duration}s > ${bgLimit}s)`;
                    updatePayload.$push.violations.severity = 'high'; // Escalate severity if limit exceeded
                }
            } else if (type === 'CHEATING_FLAG' || type === VIOLATION_TYPES.SUSPICIOUS_ACTIVITY) {
                updatePayload.$push.violations.type = VIOLATION_TYPES.SUSPICIOUS_ACTIVITY;
                updatePayload.$push.violations.severity = severity || 'medium';
                updatePayload.$push.violations.details = details || 'AI proctor flagged multiple suspicious behaviors';
                updatePayload.$inc.faceDetectionCount = 1;
            } else if (type === 'CAMERA_DISCONNECTED' || type === VIOLATION_TYPES.CAMERA_DISCONNECTED) {
                // 🚨 Camera disconnection is a critical security event
                updatePayload.$push.violations.type = VIOLATION_TYPES.CAMERA_DISCONNECTED;
                updatePayload.$push.violations.severity = 'critical';
                updatePayload.$push.violations.details = details || 'Camera/microphone stream was disconnected or permission revoked mid-session';
            } else {
                // Default handling for other violation types
                updatePayload.$push.violations.type = type || 'Unknown';
                updatePayload.$push.violations.severity = severity || 'medium';
                updatePayload.$push.violations.details = details || '';
            }

            // Fix 3: MongoDB DoS Protection (Capping array size)
            // We use the $each and $slice operator inside the $push
            const pushWrapper = updatePayload.$push.violations;
            updatePayload.$push.violations = {
                $each: [pushWrapper],
                $slice: -100 // Keep only last 100 violations
            };

            const session = await ExamSession.findOneAndUpdate(
                { student: studentId, exam: examId, status: { $in: [SESSION_STATUS.IN_PROGRESS, SESSION_STATUS.FLAGGED] } },
                { ...updatePayload, $set: { lastActivity: new Date() } },
                { new: true }
            );

            if (!session) return;

            // Broadcast to monitor room
            io.to(`exam_monitor_${examId}`).emit('mentor_alert', {
                ...data,
                studentEmail: socket.user.email,
                studentId: socket.user.id,
                violationCount: session.violations.length,
                timestamp: new Date()
            });

            if (!shouldBlock && session.violations.length > maxViolations) {
                shouldBlock = true;
                blockReason = `Maximum violations limit exceeded (${session.violations.length} > ${maxViolations})`;
            }

            if (shouldBlock) {
                await ExamSession.findByIdAndUpdate(session._id, { isBlocked: true, status: SESSION_STATUS.BLOCKED, blockReason });
                io.to(`user_${studentId}`).emit('force_block_screen', { reason: blockReason });
                
                io.to(`exam_monitor_${examId}`).emit('mentor_alert', {
                    type: VIOLATION_TYPES.VIOLATION_BLOCK,
                    studentId: session.student,
                    studentName: socket.user.name || socket.user.email,
                    reason: blockReason,
                    examId: examId,
                    timestamp: new Date()
                });
            } else {
                // Fix 3: Session-based Violation Rate Limiting (Anti-DoS)
                const minuteAgo = new Date(Date.now() - 60000);
                const recentViolations = session.violations.filter(v => new Date(v.timestamp) > minuteAgo);
                
                if (recentViolations.length > 50) { // Block if > 50 violations in 1 minute
                    const floodReason = 'Security: Violation event flooding detected.';
                    await ExamSession.findByIdAndUpdate(session._id, { isBlocked: true, status: SESSION_STATUS.BLOCKED, blockReason: floodReason });
                    io.to(`user_${studentId}`).emit('force_block_screen', { reason: floodReason });
                    return;
                }

                if (session.violations.length > 0) {
                    const warningsLeft = maxViolations - session.violations.length + 1;
                    if (warningsLeft > 0) {
                        const msg = `Security Warning: Suspicious activity detected. You have ${warningsLeft} warning(s) left before auto-termination.`;
                        io.to(`user_${studentId}`).emit('warning', { message: msg, timestamp: new Date() });
                    }
                }
            }
        } catch (err) {
            console.error('Rule engine failure:', err.message);
        }
    }

    socket.on('student_need_help', async (data) => {
        if (isRateLimited('student_need_help')) return;
        
        const xss = require('xss');
        const cleanMessage = xss(data.message || 'Student needs assistance');

        logger.info(`🆘 Help request from ${socket.user.email}: ${cleanMessage}`);
        
        io.to(`exam_monitor_${data.examId}`).emit('student_need_help', {
            studentId: socket.user.id,
            studentEmail: socket.user.email,
            examId: data.examId,
            questionId: data.questionId,
            message: cleanMessage,
            timestamp: new Date()
        });
        
        // Save help request to database for tracking
        try {
            if (data.examId) {
                await ExamSession.findOneAndUpdate(
                    { exam: data.examId, student: socket.user.id },
                    {
                        $push: { helpRequests: {
                            questionId: data.questionId,
                            message: data.message || 'Student needs assistance',
                            timestamp: new Date(),
                            resolved: false
                        }}
                    },
                    { upsert: false }
                );
            }
        } catch (err) {
            console.error('Help request DB save failed:', err.message);
        }
    });


    // --- 🛡️ PROCTORING ACTIONS: Block / Unblock / Warning ---

    socket.on('block_student', async (data) => {
        if (!['mentor', 'admin', 'super_mentor'].includes(socket.user.role)) return;
        const { studentId, examId, sessionId } = data;
        
        try {
            let targetId = studentId;
            if (sessionId && !targetId) {
                const session = await ExamSession.findById(sessionId);
                if (session) targetId = session.student;
            }

            if (!targetId) return;

            logger.info({ studentId: targetId }, `🔒 Blocking student ${targetId}`);
            await ExamSession.findOneAndUpdate(
                { $or: [{ student: targetId, exam: examId }, { _id: sessionId || targetId }] },
                { status: 'blocked', isBlocked: true, blockReason: data.reason || 'Blocked by supervisor' }
            );
            io.to(`user_${targetId}`).emit('force_block_screen', { reason: data.reason || 'Blocked by supervisor' });
        } catch (err) {
            console.error('Block student DB fail:', err.message);
        }
    });

    socket.on('unblock_student', async (data) => {
        if (!['mentor', 'admin', 'super_mentor'].includes(socket.user.role)) return;
        const { studentId, examId, sessionId } = data;

        try {
            let targetId = studentId;
            if (sessionId && !targetId) {
                const session = await ExamSession.findById(sessionId);
                if (session) targetId = session.student;
            }

            if (!targetId) return;

            logger.info({ studentId: targetId }, `🔓 Unblocking student ${targetId}`);
            await ExamSession.findOneAndUpdate(
                { status: 'blocked', $or: [{ student: targetId, exam: examId }, { _id: sessionId || targetId }] },
                { status: 'in_progress', isBlocked: false, blockReason: '' }
            );
            io.to(`user_${targetId}`).emit('unblock_screen');
        } catch (err) {
            console.error('Unblock student DB fail:', err.message);
        }
    });


    socket.on('send_warning', async (data) => {
        if (!['mentor', 'admin', 'super_mentor'].includes(socket.user.role)) return;
        const { studentId, sessionId, message } = data;
        
        try {
            let targetId = studentId;
            if (sessionId && !targetId) {
                const session = await ExamSession.findById(sessionId);
                if (session) targetId = session.student;
            }

            if (!targetId) return;

            logger.info({ studentId: targetId, message }, `⚠️ Warning to ${targetId}: ${message}`);
            io.to(`user_${targetId}`).emit('warning', { 
                message,
                timestamp: new Date()
            });
        } catch (err) {
            console.error('Warning emit fail:', err.message);
        }
    });

    // ═══════════════════════════════════════════════════════════
    //  📨 ADMIN MESSAGING SYSTEM (Secure Rooms + ACK)
    // ═══════════════════════════════════════════════════════════

    // Students join exam-specific room for targeted broadcasts
    socket.on('join_exam_room', async ({ examId }) => {
        if (!examId) return;
        
        try {
            const user = socket.user;
            const exam = await Exam.findById(examId);
            if (!exam) return;

            const isAllowed = 
                user.role === 'admin' || 
                user.role === 'super_mentor' || // Explicitly allow super_mentor
                exam.creator.toString() === user.id ||
                (user.role === 'student' && await ExamSession.exists({ exam: examId, student: user.id }));

            if (!isAllowed) {
                console.warn(`[Security] Unauthorized room join attempt: ${user.email} -> exam_${examId}`);
                socket.emit('error', { message: 'Unauthorized access to this exam room.' });
                return;
            }

            // 🛡️ Fix Bug C: Leave previous rooms to prevent event leaks
            if (socket.lastJoinedExamRoom) {
                socket.leave(socket.lastJoinedExamRoom);
                socket.leave(`exam_monitor_${socket.lastJoinedExamRoom.replace('exam_', '')}`);
                console.log(`[Socket] ${user.email} left previous rooms for exam: ${socket.lastJoinedExamRoom}`);
            }

            socket.examId = examId; 
            socket.lastJoinedExamRoom = `exam_${examId}`;
            socket.join(`exam_${examId}`);
            
            if (['mentor', 'admin', 'super_mentor'].includes(user.role)) {
                socket.join(`exam_monitor_${examId}`);
            }
            
            console.log(`[Socket] ${user.email} joined exam room: exam_${examId}`);
        } catch (err) {
            console.error('Room join error:', err.message);
        }
    });

    // 🛡️ Fix Bug A: Removed unsecured 'join_exam' legacy handler.
    // Use 'join_exam_room' which has proper authorization.

    // Secure Admin/Mentor Message Emitter
    socket.on('send_admin_message', (payload) => {
        // ⚠️ SECURITY: Only admin/mentor/super_mentor can send messages
        if (!['admin', 'mentor', 'super_mentor'].includes(socket.user.role)) {
            console.warn(`[Security Alert] Unauthorized message attempt by ${socket.user.email} (${socket.user.role})`);
            return socket.emit('error', { message: 'Unauthorized action. Only admins/mentors can send messages.' });
        }

        const messageData = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            senderEmail: socket.user.email,
            senderRole: socket.user.role,
            ...payload
        };

        if (payload.type === 'broadcast') {
            if (payload.examId) {
                // Send to specific exam room
                io.to(`exam_${payload.examId}`).emit('receive_admin_message', messageData);
                console.log(`📨 [Broadcast] to exam_${payload.examId} by ${socket.user.email}: ${payload.message}`);
            } else {
                // Global broadcast to all students in the tenant
                io.to(`inst_${socket.user.institutionId}_student`).emit('receive_admin_message', messageData);
                console.log(`📨 [Global Broadcast] by ${socket.user.email}: ${payload.message}`);
            }
        } else if (payload.type === 'direct' && payload.studentId) {
            // Send to specific student
            io.to(`user_${payload.studentId}`).emit('receive_admin_message', messageData);
            console.log(`📨 [Direct] to user_${payload.studentId} by ${socket.user.email}: ${payload.message}`);
        }
    });

    socket.on('message_ack', ({ messageId, studentId, examId }) => {
        // 🛡️ Fix Bug B: Scope ACKs ONLY to the specific exam's monitoring room
        const targetRoom = examId ? `exam_monitor_${examId}` : `exam_monitor_global`; 
        
        io.to(targetRoom).emit('ack_received', {
            messageId,
            studentId: studentId || socket.user.id,
            studentEmail: socket.user.email,
            timestamp: new Date()
        });

        // 🧠 FUTURE TODO: Store in Redis/MongoDB for analytics
        // await MessageLog.create({ messageId, studentId, acknowledged: true, time: Date.now() });
    });

    socket.on('flag_session', async (data) => {
        if (!['mentor', 'admin', 'super_mentor'].includes(socket.user.role)) return;
        const { studentId, examId, reason } = data;
        
        try {
            await ExamSession.findOneAndUpdate(
                { exam: examId, student: studentId },
                { 
                        $push: { 
                        violations: {
                            type: 'Manual Flag',
                            severity: 'medium',
                            details: reason || 'Manually flagged by administrator',
                            timestamp: new Date()
                        }
                    }
                }
            );
            console.log(`🚩 Session flagged by admin: ${studentId} in exam ${examId}`);
        } catch (err) {
            console.error('Flag session DB fail:', err.message);
        }
    });

    socket.on('disconnect', () => {
        if (watchdogTimer) clearTimeout(watchdogTimer);
        
        if (socket.user.role === 'student' && socket.examId) {
            incrementDisconnect(socket.examId);
            io.to(`exam_${socket.examId}`).emit('student_offline', { userId: socket.user.id });
        }

        // 🏎️ Fix 41: Resources are scoped locally (like eventCounts), so they auto-gc.
        // No global tracking maps to delete here, preventing ReferenceErrors.
        
        console.log(`Disconnected: ${socket.id} | User: ${socket.user.email}`);
    });
});


// ─── STARTUP ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;

// Fix 5 (Last-Mile): Cache Pre-Warming to prevent "Cold Start" thundering herd
const preWarmCache = async () => {
    try {
        console.log('Pre-warming cache: Loading active exams and global settings...');
        const Exam = require('./models/Exam');
        const Setting = require('./models/Setting');
        const cacheService = require('./services/cacheService');

        const activeExams = await Exam.find({ status: 'published' }).lean();
        const settings = await Setting.findOne().lean();

        if (settings) await cacheService.setCache('global_settings', settings, 3600);
        console.log(`Cache warmed: ${activeExams.length} exams ready.`);
    } catch (err) {
        console.error('Cache pre-warm failed:', err.message);
    }
};

const connections = new Set();
server.on('connection', socket => {
    connections.add(socket);
    socket.on('close', () => connections.delete(socket));
});

const shutdown = (signal) => {
    logger.info(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    
    // 🏎️ Fix 39: Graceful Shutdown Timeout (Max 5s)
    const forceExit = setTimeout(() => {
        logger.error('☣ Forced shutdown after 5s timeout.');
        process.exit(1);
    }, 5000);

    server.close(async () => {
        logger.info('✔ HTTP server closed.');
        
        // Sever existing keep-alive connections
        for (const socket of connections) {
            socket.destroy();
        }
        connections.clear();
        logger.info('✔ All active connections severed.');

        const mongoose = require('mongoose');
        try {
            await mongoose.connection.close();
            logger.info('✔ MongoDB connection closed.');
            clearTimeout(forceExit);
            process.exit(0);
        } catch (err) {
            logger.error('Error during MongoDB close:', err);
            process.exit(1);
        }
    });
};
// ═══════════════════════════════════════════════════════════
//  🚀 CENTRALIZED BOOTSTRAP (The Engine Room)
// ═══════════════════════════════════════════════════════════

async function bootstrap() {
    // 🛡️ Fix: Guard against double bootstrap (Nodemon/Reload)
    if (global.__BOOTSTRAPPED__) {
        console.warn('⚠️  [BOOT] Duplicate bootstrap attempt blocked.');
        return;
    }
    global.__BOOTSTRAPPED__ = true;

    try {
        console.log('[BOOT] Starting Centralized System Bootstrap...');
        
        validateEnv();
        console.log('[BOOT] Environment Variables Validated');

        await connectDB();
        console.log('[BOOT] MongoDB Connection Established');

        await connectRedis();
        console.log('[BOOT] Redis Connection Established');

        await cacheService.preWarmCache();
        console.log('[BOOT] Performance Cache Pre-warmed');

        server.listen(PORT, '0.0.0.0', () => {
            console.log(`[BOOT] Server Live & Accepting Traffic on Port ${PORT}`);
            isReady = true;

            // ─── PM2 Cluster Readiness Signal ─────────────────────────
            // PM2 ko signal bhejo ki ye worker process ab ready hai.
            // Iske bina `pm2 reload` (zero-downtime) properly kaam nahi karta.
            if (process.send) {
                process.send('ready');
                console.log(`[PM2] Worker ${process.pid} signaled ready to master`);
            }

            // Start Monitoring ONLY after server is live
            startHealthMonitor(io);
            logger.info('🩺 [Health Monitor] Real-time Health Monitor Active');


            // 📊 [SYSTEM] Startup Metrics Log
            logger.info({
                env: process.env.NODE_ENV,
                node: process.version,
                mongo: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
                redis: getRedisClient() ? 'CONNECTED' : 'DISCONNECTED',
                version: process.env.npm_package_version || '1.0.0'
            }, '🔥 [SYSTEM] Vision Backend Startup Complete');

            // 🤖 [INTERNAL WORKERS] Auto-start workers if enabled (Best for Render Free Tier)
            if (process.env.START_INTERNAL_WORKERS === 'true') {
                logger.info('⚙️  [Internal Workers] Initializing background processors...');
                try {
                    const notificationWorker = setupNotificationWorker(5);
                    const autoSubmitWorker = startAutoSubmitWorker(io); // Pass io for real-time alerts
                    
                    workers.push(notificationWorker);
                    // autoSubmitWorker might be a promise or return something, adjust if needed
                    
                    logger.info('✅ [Internal Workers] Notification & Auto-Submit workers started locally.');
                } catch (workerErr) {
                    logger.error({ err: workerErr.message }, '❌ [Internal Workers] Failed to start');
                }
            } else {
                logger.info('ℹ️  [Internal Workers] Disabled. Ensure standalone worker.js is running.');
            }
        });

    } catch (err) {
        logger.error({ err: err.message }, '❌ [BOOT] Fatal Bootstrap Failure');
        process.exit(1);
    }
}

// 🛰️ [STEP 3/5] Sentry Error Handler (Must be after all controllers but before any other error middleware)
// v10+ syntax
Sentry.setupExpressErrorHandler(app);

// ─── GRACEFUL SHUTDOWN (Cleanup Crew) ─────────────────────

const mongoose = require('mongoose');

async function gracefulShutdown(signal) {
    logger.info({ signal }, `🛑 [SHUTDOWN] Received ${signal}. Starting Safe Cleanup...`);
    isReady = false; // Immediately fail health checks

    const shutdownWithTimeout = (promise, timeout = 10000, name) =>
        Promise.race([
            promise,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Shutdown timeout for ${name}`)), timeout)
            )
        ]);

    try {
        // 1. Stop accepting new HTTP requests
        if (server) {
            await new Promise((resolve) => server.close(resolve));
            logger.info('🏁 [SHUTDOWN] HTTP Server offline');
        }

        // 2. Close Workers (allow active jobs to finish or timeout)
        logger.info('🏗️ [SHUTDOWN] Closing Active Workers...');
        await Promise.all(workers.map((w, i) => 
            shutdownWithTimeout(w.close(), 15000, `Worker-${i}`).catch(e => logger.warn(`⚠️ [SHUTDOWN] ${e.message}`))
        ));
        logger.info('⏹️ [SHUTDOWN] Background Processing terminated');

        // 3. Close Infrastructure Connections
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            logger.info('🗄️ [SHUTDOWN] MongoDB connection closed');
        }

        const redisClient = getRedisClient();
        if (redisClient) {
            await redisClient.quit();
            logger.info('🔌 [SHUTDOWN] Redis connection closed');
        }

        logger.info('✅ [SHUTDOWN] System Clean. Process exiting.');
        process.exit(0);
    } catch (err) {
        logger.error({ err: err.message }, '❌ [SHUTDOWN] Error during cleanup');
        process.exit(1);
    }
}

// OS Signal Listeners
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 🛡️ Presentation Safety Nets: Prevent server crashes from unhandled errors
process.on('uncaughtException', (err) => {
    logger.error({ err: err.message, stack: err.stack }, '[CRITICAL] Uncaught Exception');
    // Don't exit, keep the presentation alive!
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error({ reason }, '[WARNING] Unhandled Promise Rejection');
    // Log but stay alive
});

// 🚀 Start the application
bootstrap();

module.exports = { app, io }; 
 
