const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db.js');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { verifyToken, checkRole } = require('./middlewares/authMiddleware');
const User = require('./models/User');
const examRoutes = require('./routes/examRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

connectDB();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('<h1>Server & Sockets working perfectly</h1>'));

app.use('/api/exams', examRoutes);
app.use('/api/admin', adminRoutes);

app.post('/api/demo-login', async (req, res) => {
    try {
        const { email, role } = req.body;
        let user = await User.findOne({ email });
        if (!user) {
            user = new User({ 
                name: email.split('@')[0], 
                email, 
                password: 'password123', 
                role 
            });
        }
        const rolePermissions = {
            'mentor': ['create_exam', 'view_live_grid'],
            'admin': ['create_exam', 'view_live_grid', 'manage_users', 'view_reports'],
            'exam_admin': ['create_exam', 'manage_exams'],
            'student': []
        };
        user.permissions = rolePermissions[role] || [];
        
        const token = jwt.sign({ id: user._id, email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        user.currentSessionToken = token;
        await user.save();
        res.json({ message: "Login Successful", token, role: user.role });
    } catch (error) {
        res.status(500).json({ error: "Login failed" });
    }
});

const ExamSession = require('./models/ExamSession');

io.on('connection', (socket) => {
    console.log(`⚡ Connected: ${socket.id}`);
    
    socket.on('student_violation', async (data) => {
        console.log(`🚨 Violation:`, data);
        
        // Broadcast to all connected mentors in real-time
        io.emit('mentor_alert', data);
        
        // Also persist to database for audit trail
        try {
            if (data.examId && data.studentId) {
                const User = require('./models/User');
                const student = await User.findOne({ email: data.studentId });
                if (student) {
                    await ExamSession.findOneAndUpdate(
                        { exam: data.examId, student: student._id },
                        {
                            $push: { violations: {
                                type: data.type || data.reason || 'Unknown',
                                severity: data.severity || 'medium',
                                details: data.details || '',
                                timestamp: new Date()
                            }},
                            $inc: data.type === 'Tab Switch' ? { tabSwitchCount: 1 } : {}
                        },
                        { upsert: false } // Only update if session exists
                    );
                }
            }
        } catch (err) {
            console.error('Socket violation DB save failed:', err.message);
        }
    });
    
    socket.on('disconnect', () => console.log(`❌ Disconnected: ${socket.id}`));
});

app.get('/api/mentor-dashboard', verifyToken, checkRole('mentor'), (req, res) => res.json({ message: "Welcome Mentor" }));
app.get('/api/exam-panel', verifyToken, checkRole('student'), (req, res) => res.json({ message: "Welcome Student" }));

// 🎯 NEW: Code Execution Route (Judge0)
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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server on port ${PORT}`));




