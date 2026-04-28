require('dotenv').config();
const mongoose = require('mongoose');
const Exam = require('./src/models/Exam');
const ExamSession = require('./src/models/ExamSession');
const User = require('./src/models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://Vision:Vinit123%4088@visionbrowser.4vybepv.mongodb.net/?appName=VisionBrowser';

mongoose.connect(MONGO_URI).then(async () => {
  // Find the student
  const student = await User.findOne({ email: /vinit\.student/i }).lean();
  console.log('Student:', student?.name, '|', student?.email, '| ID:', student?._id);

  // Find ALL in_progress sessions for this student and populate exam
  const sessions = await ExamSession.find({ 
    student: student?._id, 
    status: 'in_progress' 
  }).populate('exam', 'title questions status').lean();
  
  console.log('\n--- Active sessions for student ---');
  sessions.forEach(s => {
    console.log(`  Session ${s._id}: exam=${s.exam?.title || 'DELETED'} | exam questions=${s.exam?.questions?.length ?? 'N/A'} | remaining=${s.remainingTimeSeconds}s`);
  });

  // Find the demo exam
  const demoExam = await Exam.findOne({ title: /Full Stack Developer.*Demo/ }).lean();
  console.log('\n--- Demo Exam ---');
  console.log('ID:', demoExam?._id);
  console.log('Title:', demoExam?.title);
  console.log('Status:', demoExam?.status);
  console.log('Questions:', demoExam?.questions?.length);

  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
