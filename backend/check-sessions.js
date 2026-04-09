const mongoose = require('mongoose');
const ExamSession = require('./src/models/ExamSession');
require('dotenv').config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const sessions = await ExamSession.find({ status: 'in_progress' }).sort({ createdAt: -1 }).limit(3).lean();
    console.log(JSON.stringify(sessions, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
check();
