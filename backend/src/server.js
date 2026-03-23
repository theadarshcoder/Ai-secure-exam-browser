const express = require('express');
const connectDB = require('./config/db.js');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { verifyToken, checkRole } = require('./middlewares/authMiddleware');
const User = require('./models/User');
const examRoutes = require('./routes/examRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
connectDB();
app.use(express.json());

app.get('/', (req, res) => res.send('<h1>Server is working perfectly</h1>'));

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
        const token = jwt.sign({ id: user._id, email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        user.currentSessionToken = token;
        await user.save();
        res.json({ message: "Login Successful", token, role: user.role });
    } catch (error) {
        res.status(500).json({ error: "Login failed" });
    }
});

app.get('/api/mentor-dashboard', verifyToken, checkRole('mentor'), (req, res) => {
    res.json({ message: "Welcome to Mentor Dashboard" });
});

app.get('/api/exam-panel', verifyToken, checkRole('student'), (req, res) => {
    res.json({ message: "Welcome Student" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));

