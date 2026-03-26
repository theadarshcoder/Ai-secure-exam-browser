const express = require('express');
const connectDB = require('./config/db.js');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { verifyToken, checkRole } = require('./middlewares/authMiddleware');

const app = express();
connectDB();

app.use(express.json()); // Enable JSON body parsing

app.get('/', (req, res) => {
    res.send('<h1>Sir G dekh rhe ho akdm prfect chal rha h</h1>');
});

// 🎯 DEMO ROUTE 1: Login Route (Generates token for demo)
app.post('/api/demo-login', (req, res) => {
    const { email, role } = req.body;
    
    // In a real app, we would verify credentials against DB here
    const token = jwt.sign({ email, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    res.json({ message: "Login Successful", token, role });
});

// 🎯 DEMO ROUTE 2: Protected Route (Mentor only)
app.get('/api/mentor-dashboard', verifyToken, checkRole('mentor'), (req, res) => {
    res.json({ message: "✅ Welcome to Mentor Dashboard! Live monitoring active." });
});

// 🎯 DEMO ROUTE 3: Normal Student Route
app.get('/api/exam-panel', verifyToken, checkRole('student'), (req, res) => {
    res.json({ message: "✅ Welcome Student! Your exam is about to start." });
});

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
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
