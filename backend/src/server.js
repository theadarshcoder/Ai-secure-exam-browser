const express = require('express');
const connectDB = require('./config/db.js');
require('dotenv').config();

const app = express();

// 1. Database ko connect karo
connectDB();

// 2. Ek chota sa test route mentor ko browser par dikhane ke liye
app.get('/', (req, res) => {
    res.send('ProctoShield API is running and Database is Connected! 🚀');
});

// 3. Server start karo
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
