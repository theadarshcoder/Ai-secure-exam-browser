const mongoose = require('mongoose');
require('dotenv').config(); 

const connectDB = async () => {
    // 🚀 Performance Foundation: Slow Query Logger
    mongoose.plugin((schema) => {
        schema.pre(['find', 'findOne', 'countDocuments', 'aggregate', 'findOneAndUpdate'], function() {
            this._startTime = Date.now();
        });

        schema.post(['find', 'findOne', 'countDocuments', 'aggregate', 'findOneAndUpdate'], function() {
            if (this._startTime) {
                const duration = Date.now() - this._startTime;
                if (duration > 500) {
                    console.warn(`🐢 [SLOW QUERY] ${this.model?.modelName || 'Unknown'}.${this.op} took ${duration}ms`);
                }
            }
        });
    });

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
