const mongoose = require('mongoose');
require('dotenv').config(); 

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log(`Success: MongoDB Connected to ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: MongoDB Connection Failed!`);
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
