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

// ─── Route Imports ───────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const examRoutes = require('./routes/examRoutes');
const adminRoutes = require('./routes/adminRoutes');
const sessionRoutes = require('./routes/sessionRoutes');

const app = express();
const server = http.createServer(app);

// 🛡️ SECURITY 0: Helmet (HTTP Header Protection)
const helmet = require('helmet');
app.use(helmet());


// ═══════════════════════════════════════════════════════════
//  🔒 SECURITY 1: Strict CORS Setup
// ═══════════════════════════════════════════════════════════
// Pehle: app.use(cors())  → koi bhi domain se API hit kar sakta tha (KHATARNAK!)
// Ab:    Sirf allowed frontends se requests accept hongi
//
// .env mein FRONTEND_URL set karo:
//   Development: http://localhost:5173
//   Production:  https://tumhari-app.vercel.app
//
// Multiple URLs chahiye? Comma se alag karo:
//   FRONTEND_URL=http://localhost:5173,https://tumhari-app.vercel.app

const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : ['http://localhost:5173'];  // fallback for development

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (Postman, mobile apps, server-to-server)
        // Production mein isko hata do agar strictly browser-only chahiye
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);       // ✅ Allowed origin
        } else {
            console.warn(`🚫 CORS blocked request from: ${origin}`);
            callback(new Error('CORS policy: This origin is not allowed!'));
        }
    },
    credentials: true,   // Cookies/Auth headers allow karo
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());


// ═══════════════════════════════════════════════════════════
//  🛡️ SECURITY 2: Rate Limiting (Brute-Force Protection)
// ═══════════════════════════════════════════════════════════
// Koi baar-baar password guess kare toh usse rok do!

// Global Rate Limiter — Saari APIs ke liye
// 100 requests per 15 minutes per IP (normal usage ke liye kaafi hai)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,    // 15 minute ka window
    max: 100,                     // Max 100 requests per window
    message: {
        error: 'Bahut zyada requests! 15 minute baad try karo.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,        // Rate limit info headers mein bhi bhejo
    legacyHeaders: false
});

// Auth Rate Limiter — Sirf Login/Register ke liye (STRICT!)
// 10 attempts per 15 minutes per IP — brute force attack ruk jayega
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,    // 15 minute ka window
    max: 10,                      // Sirf 10 login attempts!
    message: {
        error: 'Bahut zyada login attempts! 15 minute baad try karo.',
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
// Pehle: koi bhi socket connect kar ke cheating alerts sun sakta tha (KHATARNAK!)
// Ab:    Sirf valid JWT token wale users hi connect ho payenge

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,             // Same CORS rules as HTTP
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Socket.IO Authentication Middleware
// Har connection se pehle JWT token verify hoga
io.use(async (socket, next) => {
    try {
        // Token client se aayega: io(URL, { auth: { token: "xyz" } })
        const token = socket.handshake.auth?.token
            || socket.handshake.headers?.authorization?.split(' ')[1];

        if (!token) {
            return next(new Error('🚫 Authentication required! Token bhejo.'));
        }

        // JWT verify karo
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Database mein check karo ki ye token abhi bhi active hai
        // (agar user ne doosri jagah login kiya toh purana token invalid hoga)
        const user = await User.findById(decoded.id);
        if (!user || user.currentSessionToken !== token) {
            return next(new Error('🚫 Session expired! Dobara login karo.'));
        }

        // User info socket object mein attach karo — baad mein use hoga
        socket.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        };

        console.log(`🔑 Socket authenticated: ${decoded.email} (${decoded.role})`);
        next();  // ✅ Connection allowed!

    } catch (error) {
        console.warn(`🚫 Socket auth failed: ${error.message}`);
        next(new Error('🚫 Invalid token! Login dobara karo.'));
    }
});


// ═══════════════════════════════════════════════════════════
//  📡 Routes Registration
// ═══════════════════════════════════════════════════════════

connectDB();

app.get('/', (req, res) => res.send('<h1>Server & Sockets working perfectly 🔒</h1>'));

// Auth routes — Rate limiter EXTRA tight lagao
app.use('/api/auth', authLimiter, authRoutes);

// Baki routes — Global limiter se protected hain already
app.use('/api/exams', examRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/session', sessionRoutes);  // 🚨 Violation logging & history




// ═══════════════════════════════════════════════════════════
//  📡 Socket.IO Event Handlers (Now Secured!)
// ═══════════════════════════════════════════════════════════
// Ab yahan sirf authenticated users hi pahunchenge

const ExamSession = require('./models/ExamSession');

io.on('connection', (socket) => {
    console.log(`⚡ Connected: ${socket.id} | User: ${socket.user.email} (${socket.user.role})`);
    
    // Student ko apne role-specific room mein join karao
    // Isse mentors ko sirf unka data milega, broadcast nahi
    socket.join(`role_${socket.user.role}`);
    socket.join(`user_${socket.user.id}`);

    socket.on('student_violation', async (data) => {
        // Extra check: Sirf students hi violation bhej sakte hain
        if (socket.user.role !== 'student') {
            return socket.emit('error', { message: 'Sirf students violation report kar sakte hain!' });
        }

        console.log(`🚨 Violation from ${socket.user.email}:`, data);
        
        // Broadcast sirf mentors aur admins ko (students ko nahi!)
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
                            type: data.type || data.reason || 'Unknown',
                            severity: data.severity || 'medium',
                            details: data.details || '',
                            timestamp: new Date()
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
    
    socket.on('disconnect', () => {
        console.log(`❌ Disconnected: ${socket.id} | User: ${socket.user.email}`);
    });
});


// ═══════════════════════════════════════════════════════════
//  🎯 Protected API Endpoints
// ═══════════════════════════════════════════════════════════

app.get('/api/mentor-dashboard', verifyToken, checkRole('mentor'), (req, res) => res.json({ message: "Welcome Mentor" }));
app.get('/api/exam-panel', verifyToken, checkRole('student'), (req, res) => res.json({ message: "Welcome Student" }));

// Code Execution Route (Judge0)
const { executeCode } = require('./services/judge0.js');

const LANGUAGE_MAP = {
  'javascript': 63,
  'python': 71,
  'python3': 71,
  'java': 62,
  'cpp': 54,
  'c': 50
};

app.post('/api/execute-code', verifyToken, async (req, res) => {
  try {
    const { source_code, language, stdin = '' } = req.body;
    
    if (!source_code) {
      return res.status(400).json({ error: 'Source code is required' });
    }

    const language_id = LANGUAGE_MAP[language.toLowerCase()] || 63;
    const result = await executeCode(source_code, language_id, stdin);
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Code execution failed', details: err.message });
  }
});


// ═══════════════════════════════════════════════════════════
//  🚀 Start Server
// ═══════════════════════════════════════════════════════════

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`🔒 CORS: Allowed origins → ${allowedOrigins.join(', ')}`);
    console.log(`🛡️  Rate Limit: 100 req/15min (global) | 10 req/15min (auth)`);
    console.log(`🔌 Socket.IO: JWT authentication enabled\n`);
});
