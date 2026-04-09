const mongoose = require('mongoose');
const ExamSession = require('../backend/src/models/ExamSession');
require('dotenv').config({ path: '../backend/.env' });

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const sessions = await ExamSession.find({ status: 'in_progress' }).sort({ createdAt: -1 }).limit(3).lean();
    console.log(JSON.stringify(sessions, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
check();
