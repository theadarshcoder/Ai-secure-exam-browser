require('dotenv').config();
const mongoose = require('mongoose');
const Exam = require('./src/models/Exam');
const ExamSession = require('./src/models/ExamSession');
const User = require('./src/models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://Vision:Vinit123%4088@visionbrowser.4vybepv.mongodb.net/?appName=VisionBrowser';

mongoose.connect(MONGO_URI).then(async () => {
  // Find all in_progress sessions
  const sessions = await ExamSession.find({ status: 'in_progress' }).lean();
  
  const toMarkAbandoned = [];
  for (const s of sessions) {
    const exam = await Exam.findById(s.exam).lean();
    if (!exam) {
      toMarkAbandoned.push(s._id);
      console.log(`Stale session found: ${s._id} (exam deleted)`);
    }
  }

  if (toMarkAbandoned.length > 0) {
    await ExamSession.updateMany(
      { _id: { $in: toMarkAbandoned } },
      { $set: { status: 'auto_submitted', score: 0, percentage: 0, passed: false } }
    );
    console.log(`\n✅ Cleaned up ${toMarkAbandoned.length} stale sessions`);
  } else {
    console.log('No stale sessions found.');
  }

  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
