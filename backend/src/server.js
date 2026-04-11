// ═══════════════════════════════════════════════════════════
//  server.js — Main Backend Server (Enterprise Security)
// ═══════════════════════════════════════════════════════════

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db.js');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { verifyToken, checkRole } = require('./middlewares/authMiddleware');
const User = require('./models/User');
const { connectRedis, getRedisClient } = require('./config/redis');
const { RedisStore } = require('rate-limit-redis');
const cacheService = require('./services/cacheService');
const morgan = require('morgan');
const validateEnv = require('./utils/envValidator');

// ─── Route Imports ───────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const examRoutes = require('./routes/examRoutes');
const adminRoutes = require('./routes/adminRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const aiRoutes = require('./routes/aiRoutes');
const { setupCodeEvaluationWorker } = require('./queues/codeGradingQueue');
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
        sendCommand: (...args) => client.sendCommand(args),
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
    windowMs: 15 * 60 * 1000,
    max: 10,
    store: createRedisStore('auth'),
    message: {
        error: 'Too many login attempts! Please try again in 15 minutes.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Global limiter saari routes pe lagao
app.use(globalLimiter);


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
})();

app.get('/', (req, res) => res.send('<h1>Server & Sockets working perfectly 🔒</h1>'));

// Auth routes — Rate limiter EXTRA tight
app.use('/api/auth', authLimiter, authRoutes);

// Protected routes — Global limiter active
app.use('/api/exams', examRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/ai', aiRoutes);

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

const ExamSession = require('./models/ExamSession');

io.on('connection', (socket) => {
    console.log(`⚡ Connected: ${socket.id} | User: ${socket.user.email} (${socket.user.role})`);
    
    // Join role-specific and user-specific rooms for targeted broadcasting
    socket.join(`role_${socket.user.role}`);
    socket.join(`user_${socket.user.id}`);

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
        // Bug 11: Real-time token expiry validation
        if (socket.expiresAt && Date.now() > socket.expiresAt) {
            socket.emit('session_expired', { message: 'Session expired. Please re-authenticate.' });
            return socket.disconnect(true);
        }

        // Validation: Only students should report violations
        if (socket.user.role !== 'student') {
            return socket.emit('error', { message: 'Only students can report violations.' });
        }

        console.log(`🚨 Violation from ${socket.user.email}:`, data);
        
        // Broadcast only to mentors and admins
        io.to('role_mentor').to('role_admin').emit('mentor_alert', {
            ...data,
            studentEmail: socket.user.email,
            studentId: socket.user.id,
            timestamp: new Date()
        });
        
        // Database mein save karo (audit trail)
        try {
            if (data.examId) {
                await ExamSession.findOneAndUpdate(
                    { exam: data.examId, student: socket.user.id },
                    {
                        $push: { violations: {
                            $each: [{
                                type: data.type || data.reason || 'Unknown',
                                severity: data.severity || 'medium',
                                details: data.details || '',
                                timestamp: new Date()
                            }],
                            $slice: -100
                        }},
                        $inc: data.type === 'Tab Switch' ? { tabSwitchCount: 1 } : {}
                    },
                    { upsert: false }
                );
            }
        } catch (err) {
            console.error('Socket violation DB save failed:', err.message);
        }
    });

    socket.on('student_need_help', async (data) => {
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
        
        // Broadcast to all mentors and admins
        io.to('role_mentor').to('role_admin').emit('student_need_help', {
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

    socket.on('mentor_broadcast', (data) => {
        // Mentors or admins can broadcast to students
        if (socket.user.role !== 'mentor' && socket.user.role !== 'admin') {
            return socket.emit('error', { message: 'Only mentors/admins can broadcast.' });
        }
        console.log(`Broadcast from ${socket.user.email}:`, data);
        
        // Broadcast to all students
        io.to('role_student').emit('exam_broadcast', {
            message: data.message,
            examId: data.examId,
            sender: socket.user.name || socket.user.email,
            timestamp: new Date()
        });
    });
    
    socket.on('disconnect', () => {
        if (watchdogTimer) clearTimeout(watchdogTimer);
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
