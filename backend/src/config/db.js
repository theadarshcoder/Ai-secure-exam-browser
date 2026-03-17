const mongoose = require('mongoose');
require('dotenv').config(); // Yeh .env file se data uthayega

const connectDB = async () => {
  try {
    // .env file se MONGODB_URI le kar connect kar rahe hain
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log(`Success: MongoDB Connected to ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: MongoDB Connection Failed!`);
    console.error(error.message);
    process.exit(1); // Agar fail hua toh server band kar do
  }
};

module.exports = connectDB;
