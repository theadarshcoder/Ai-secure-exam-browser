const mongoose = require('mongoose');
const ExamSession = require('./src/models/ExamSession');
const Exam = require('./src/models/Exam');
const dotenv = require('dotenv');

dotenv.config();

async function checkSessions() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const sessions = await ExamSession.find({ status: { $in: ['in_progress', 'paused'] } }).populate('exam');
    console.log(`Found ${sessions.length} active/paused sessions`);

    sessions.forEach(s => {
        const now = new Date();
        const endTime = s.endTime || new Date(s.startedAt.getTime() + (s.exam.duration * 60 * 1000));
        const isExpired = endTime <= now;
        
        console.log(`Session: ${s._id}`);
        console.log(`  Student: ${s.student}`);
        console.log(`  Exam: ${s.exam.title}`);
        console.log(`  Status: ${s.status}`);
        console.log(`  StartedAt: ${s.startedAt}`);
        console.log(`  EndTime: ${s.endTime || 'MISSING'}`);
        console.log(`  Calculated EndTime: ${endTime}`);
        console.log(`  Is Expired: ${isExpired}`);
        console.log('---');
    });

    await mongoose.disconnect();
}

checkSessions().catch(console.error);
