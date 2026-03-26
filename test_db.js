const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

console.log("Connecting to:", process.env.MONGODB_URI.split('@')[0] + "@..."); // Mask password
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("✅ SUCCESS: MongoDB Atlas Connected!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ ERROR: Connection Failed!");
        console.error(err.message);
        process.exit(1);
    });

setTimeout(() => {
    console.log("⏳ Connection Timeout - Check your IP Access or Password");
    process.exit(1);
}, 10000);
