const mongoose = require('mongoose');
require('dotenv').config(); 

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 10, // 🏎️ Fix: Reduced to 10 to prevent connection pool exhaustion on Atlas free tier
            serverSelectionTimeoutMS: 5000,
        });
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error(`❌ MongoDB Connection Failed: ${error.message}`);
        process.exit(1); // Exit so Render/PM2 can auto-restart
    }
};

module.exports = connectDB;
