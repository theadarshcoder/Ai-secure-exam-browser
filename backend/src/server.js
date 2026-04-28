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
const { verifyToken, checkRole } = require('./middlewares/authMiddleware');
const User = require('./models/User');
const Exam = require('./models/Exam');
const ExamSession = require('./models/ExamSession');
const Setting = require('./models/Setting');
const { connectRedis, getRedisClient } = require('./config/redis');
const { RedisStore } = require('rate-limit-redis');
const cacheService = require('./services/cacheService');
const morgan = require('morgan');
const validateEnv = require('./utils/envValidator');
const { startHealthMonitor, incrementDisconnect } = require('./services/healthMonitor');

// ─── Route Imports ───────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const examRoutes = require('./routes/examRoutes');
const adminRoutes = require('./routes/adminRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const aiRoutes = require('./routes/aiRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const { setupCodeEvaluationWorker } = require('./queues/codeGradingQueue');
const { setupFrontendEvaluationWorker } = require('./queues/frontendGradingQueue');
const { setupInviteEmailWorker } = require('./queues/inviteEmailQueue');
const { startIntelligenceWorker } = require('./queues/intelligenceWorker');
const { inviteVerifyLimiter } = require('./middlewares/rateLimiter');
const traceMiddleware = require('./middlewares/traceMiddleware');

const app = express();
const server = http.createServer(app);

app.use(traceMiddleware); // Generate Request IDs

// Customize Morgan for easy debugging with prefix Request ID
morgan.token('req-id', (req) => req.requestId ? req.requestId.split('-')[0] : '????');
app.use(morgan('[:req-id] :method :url :status - :response-time ms'));


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

const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'https://vision-live.pages.dev'
];

// Combine with .env URLs if present
if (process.env.FRONTEND_URL) {
    const envOrigins = process.env.FRONTEND_URL.split(',').map(url => url.trim());
    envOrigins.forEach(url => {
        if (!allowedOrigins.includes(url)) allowedOrigins.push(url);
    });
}

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (Postman, mobile apps)
        if (!origin) return callback(null, true);

        if (isAllowedOrigin(origin)) {
            callback(null, true);
        } else {
            console.warn(`🚫 CORS blocked: ${origin}`);
            callback(new Error('CORS policy: Not allowed.'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-device-id']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '100kb' }));
app.use(mongoSanitize()); // Prevent NoSQL Injection attacks

function isAllowedOrigin(origin) {
    if (!origin) return true;

    if (allowedOrigins.includes(origin)) {
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

// ⚡ SHARED STORE HELPER: Cluster-Safe Rate Limiting
const createRedisStore = (label) => {
    const client = getRedisClient();
    if (!client) {
        console.warn(`⚠️  [SCALING] Redis not ready. Using In-Memory fallback for ${label} rate limiter.`);
        return undefined; 
    }
    return new RedisStore({
        // ioredis uses .call() for raw commands
        sendCommand: (...args) => client.call(...args),
        prefix: `vision_rl:${label}:`,
    });
};

// Global Rate Limiter — Saari APIs ke liye
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    store: createRedisStore('global'),
    message: {
        error: 'Too many requests! Please try again in 15 minutes.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Auth Rate Limiter — Strict limits for Login/Register endpoints
const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 🛡️ Reduced window to 5 minutes
    max: 10, // 🛡️ Reduced attempts to 10
    store: createRedisStore('auth'),
    message: {
        error: 'Too many login attempts! Please try again in 5 minutes.',
        retryAfter: '5 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Relaxed Rate Limiter for Auto-Save
const autoSaveLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, 
    store: createRedisStore('autosave'),
    message: { error: 'Too many save attempts. Slow down!' },
    standardHeaders: true,
    legacyHeaders: false
});

// 🛡️ Telemetry Limiter — Prevent log spamming
const telemetryLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 20, // 🛡️ Max 20 logs per minute per user
    store: createRedisStore('telemetry'),
    message: { error: 'Stop spamming logs!' },
    standardHeaders: true,
    legacyHeaders: false
});

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
    }
});

// Expose Socket.IO instance to routes/controllers globally
app.set('io', io);

// 🚀 Initialize Background Workers
setupCodeEvaluationWorker(io);
setupFrontendEvaluationWorker(io);
setupInviteEmailWorker();
startIntelligenceWorker();
startHealthMonitor(io);

// Socket.IO Authentication Middleware
// Har connection se pehle JWT token verify hoga
io.use(async (socket, next) => {
    try {
        // Token client se aayega: io(URL, { auth: { token: "xyz" } })
        const token = socket.handshake.auth?.token
            || socket.handshake.headers?.authorization?.split(' ')[1];

        if (!token) {
            return next(new Error('🚫 Authentication required! Token missing.'));
        }

        // JWT verify karo
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // ⚡ SCALING GUARD: Check Redis first (Cache Hit = 0 DB Hits)
        const cachedToken = await cacheService.getUserSession(decoded.id);

        if (cachedToken) {
            if (cachedToken !== token) {
                return next(new Error('🚫 Session terminated! You logged in from another device.'));
            }
            console.log(`📡 [SCALING] Socket Auth: Redis Cache Hit for ${decoded.email}`);
        } else {
            // 🔄 CACHE MISS: Fallback to MongoDB & Backfill
            console.log(`🔄 [SCALING] Socket Auth: Redis Cache Miss for ${decoded.email}. Fetching from DB.`);
            const user = await User.findById(decoded.id);
            if (!user || (user.currentSessionToken && user.currentSessionToken !== token)) {
                return next(new Error('🚫 Session terminated! You logged in from another device.'));
            }
            // Backfill cache for next time
            await cacheService.saveUserSession(decoded.id, token);
        }

        // User info socket object mein attach karo — baad mein use hoga
        socket.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        };
        socket.expiresAt = decoded.exp * 1000;

        console.log(`🔑 Socket authenticated: ${decoded.email} (${decoded.role})`);
        next();

    } catch (error) {
        console.warn(`🚫 Socket auth failed: ${error.message}`);
        next(new Error('🚫 Invalid token! Please login again.'));
    }
});


// ═══════════════════════════════════════════════════════════
//  🔌 SECURITY 3: Initialize Database & Cache
// ═══════════════════════════════════════════════════════════

(async () => {
    validateEnv(); // Verify required variables before starting
    await connectDB();
    await connectRedis();
    startHealthMonitor(io); // Start monitoring after DB is connected
})();

app.get('/', (req, res) => res.send('<h1>Server & Sockets working perfectly 🔒</h1>'));

// Auth routes — Rate limiter EXTRA tight
app.use('/api/auth/verify-invite', inviteVerifyLimiter);
app.use('/api/auth', authLimiter, authRoutes);

// 🛡️ CRITICAL: Apply relaxed limiter to save-progress route specifically 
// and apply global limiter to other exam routes.
app.use('/api/exams/save-progress', autoSaveLimiter);

// Protected routes — Global limiter active
app.use('/api/exams', globalLimiter, examRoutes);
app.use('/api/admin', globalLimiter, adminRoutes);
app.use('/api/session', verifyToken, telemetryLimiter, sessionRoutes);
app.use('/api/ai', globalLimiter, aiRoutes);
app.use('/api/upload', verifyToken, globalLimiter, uploadRoutes);

// ─── 404 Global Handler ──────────────────────────────────
app.use((req, res, next) => {
    res.status(404).json({ error: 'Endpoint Not Found. Are you lost?' });
});

// ─── ERROR Global Handler ────────────────────────────────
const { errorHandler } = require('./middlewares/errorMiddleware');
app.use(errorHandler);




// ═══════════════════════════════════════════════════════════
//  📡 Socket.IO Event Handlers (Now Secured!)
// ═══════════════════════════════════════════════════════════
// Ab yahan sirf authenticated users hi pahunchenge



io.on('connection', (socket) => {
    console.log(`⚡ Connected: ${socket.id} | User: ${socket.user.email} (${socket.user.role})`);
    
    // Join role-specific and user-specific rooms for targeted broadcasting
    socket.join(`role_${socket.user.role}`);
    socket.join(`user_${socket.user.id}`);

    // --- 🛡️ SECURITY: Socket Rate Limiting (Anti-DDoS) ---
    const lastEmissions = new Map();
    const isRateLimited = (eventName, limitMs = 2000) => {
        const now = Date.now();
        const last = lastEmissions.get(eventName) || 0;
        if (now - last < limitMs) {
            socket.emit('error', { message: `Slow down! You are sending '${eventName}' events too fast.` });
            return true;
        }
        lastEmissions.set(eventName, now);
        return false;
    };

    // --- 🛡️ Silent Re-Authentication (Bug Fix 5) ---
    socket.on('re_auth', (token) => {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log(`🔄 [SCALING] Socket Re-Auth: ${decoded.email}`);
            
            // Update socket context
            socket.user = { id: decoded.id, email: decoded.email, role: decoded.role };
            socket.expiresAt = decoded.exp * 1000;

            // Reset Watchdog timer
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
        } catch (err) {
            console.warn(`🚫 Socket re-auth failed for ${socket.id}: ${err.message}`);
        }
    });

    // --- 🛡️ Session Watchdog (Token Expiry Check) ---
    const remainingTime = socket.expiresAt - Date.now();
    let watchdogTimer = null;

    if (remainingTime > 0) {
        watchdogTimer = setTimeout(() => {
            console.warn(`🚦 Socket Session Expired: ${socket.user.email}. Force disconnecting.`);
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
            const settings = await Setting.findOne() || new Setting();
            const maxViolations = settings.maxViolations || 5;
            const bgLimit = settings.backgroundLimitSeconds || 10;

            let shouldBlock = false;
            let blockReason = '';
            let updatePayload = { 
                $push: { violations: { timestamp: new Date() } }, 
                $inc: { violationCount: 1 } 
            };

            // Mapping raw violation types to standardized ones
            if (type === 'TAB_HIDDEN' || type === 'Tab Switch') {
                if (duration > bgLimit) {
                    shouldBlock = true;
                    blockReason = `Background limit exceeded (${duration}s > ${bgLimit}s)`;
                } else {
                    updatePayload.$push.violations.type = 'Tab Switch';
                    updatePayload.$push.violations.severity = 'low';
                    updatePayload.$push.violations.details = details || `Background duration: ${duration}s`;
                    updatePayload.$inc.tabSwitchCount = 1;
                }
            } else if (type === 'CHEATING_FLAG' || type === 'Suspicious Activity') {
                updatePayload.$push.violations.type = 'Suspicious Activity';
                updatePayload.$push.violations.severity = severity || 'medium';
                updatePayload.$push.violations.details = details || 'AI proctor flagged multiple suspicious behaviors';
                updatePayload.$inc.faceDetectionCount = 1;
            } else {
                // Default handling for other violation types
                updatePayload.$push.violations.type = type || 'Unknown';
                updatePayload.$push.violations.severity = severity || 'medium';
                updatePayload.$push.violations.details = details || '';
            }

            const session = await ExamSession.findOneAndUpdate(
                { student: studentId, exam: examId, status: { $in: ['in_progress', 'flagged'] } },
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
                await ExamSession.findByIdAndUpdate(session._id, { isBlocked: true, status: 'blocked', blockReason });
                io.to(`user_${studentId}`).emit('force_block_screen', { reason: blockReason });
                
                io.to(`exam_monitor_${examId}`).emit('mentor_alert', {
                    type: 'VIOLATION_BLOCK',
                    studentId: session.student,
                    studentName: socket.user.name || socket.user.email,
                    reason: blockReason,
                    examId: examId,
                    timestamp: new Date()
                });
            } else if (session.violations.length > 0) {
                const warningsLeft = maxViolations - session.violations.length + 1;
                if (warningsLeft > 0) {
                    const msg = `Security Warning: Suspicious activity detected. You have ${warningsLeft} warning(s) left before auto-termination.`;
                    io.to(`user_${studentId}`).emit('warning', { message: msg, timestamp: new Date() });
                }
            }
        } catch (err) {
            console.error('Rule engine failure:', err.message);
        }
    }

    socket.on('student_need_help', async (data) => {
        if (isRateLimited('student_need_help', 5000)) return;
        
        // Bug 11: Real-time token expiry validation
        if (socket.expiresAt && Date.now() > socket.expiresAt) {
            socket.emit('session_expired', { message: 'Session expired. Please re-authenticate.' });
            return socket.disconnect(true);
        }

        // Only students can request help
        if (socket.user.role !== 'student') {
            return socket.emit('error', { message: 'Only students can request help.' });
        }

        console.log(`🆘 Help request from ${socket.user.email}:`, data);
        
        // 🛡️ Fix Bug B: Scope help requests ONLY to exam-specific monitor room
        io.to(`exam_monitor_${data.examId}`).emit('student_need_help', {
            studentId: socket.user.id,
            studentEmail: socket.user.email,
            examId: data.examId,
            questionId: data.questionId,
            message: data.message || 'Student needs assistance',
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

            console.log(`🔒 Blocking student ${targetId}`);
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

            console.log(`🔓 Unblocking student ${targetId}`);
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

            console.log(`⚠️ Warning to ${targetId}: ${message}`);
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
                // Global broadcast to all students
                io.to('role_student').emit('receive_admin_message', messageData);
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

        console.log(`❌ Disconnected: ${socket.id} | User: ${socket.user.email}`);
    });
});



// ═══════════════════════════════════════════════════════════
//  🚀 Start Server
// ═══════════════════════════════════════════════════════════

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`🔒 CORS: Allowed origins → ${allowedOrigins.join(', ')}`);
    console.log(`🛡️  Rate Limit: 100 req/15min (global) | 10 req/15min (auth)`);
    console.log(`🔌 Socket.IO: JWT authentication enabled\n`);
});

// ─── GRACEFUL SHUTDOWN ───────────────────────────────────
// Stop accepting new connections and close DB cleanly
const shutdown = () => {
    console.log('\n🛑 SIGINT/SIGTERM received. Starting graceful shutdown...');
    server.close(async () => {
        console.log('✔ HTTP server closed.');
        const mongoose = require('mongoose');
        try {
            await mongoose.connection.close();
            console.log('✔ MongoDB connection closed.');
            process.exit(0);
        } catch (err) {
            console.error('Error during MongoDB close:', err);
            process.exit(1);
        }
    });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
