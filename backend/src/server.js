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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
