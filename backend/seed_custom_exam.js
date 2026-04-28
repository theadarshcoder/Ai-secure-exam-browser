require('dotenv').config();
const mongoose = require('mongoose');
const Exam = require('./src/models/Exam');
const User = require('./src/models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://Vision:Vinit123%4088@visionbrowser.4vybepv.mongodb.net/?appName=VisionBrowser';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to DB');

  let creator = await User.findOne({ role: { $in: ['admin', 'mentor', 'super_mentor'] } });
  if (!creator) {
    console.error('❌ No admin/mentor found. Please create one first.');
    process.exit(1);
  }
  console.log(`👤 Using creator: ${creator.name} (${creator.role})`);

  const exam = new Exam({
    title: 'Quick Assessment — 3 Questions',
    description: 'A quick assessment containing exactly 1 MCQ, 1 Short Answer, and 1 Coding question to test the platform functionality.',
    category: 'General',
    duration: 30,           // 30 minutes
    totalMarks: 30,         // 5 + 10 + 15 = 30
    passingMarks: 15,
    creator: creator._id,
    status: 'published',
    questions: [
      {
        type: 'mcq',
        questionText: 'Which of the following is a dynamically typed programming language?',
        marks: 5,
        options: ['Java', 'C++', 'JavaScript', 'Rust'],
        correctOption: 2
      },
      {
        type: 'short',
        questionText: 'Explain the main difference between synchronous and asynchronous programming in two to three sentences.',
        marks: 10,
        maxWords: 50
      },
      {
        type: 'coding',
        questionText: 'Write a function <code>reverseString(str)</code> that takes a string and returns it reversed. For example, "hello" becomes "olleh".',
        marks: 15,
        language: 'javascript',
        initialCode: 'function reverseString(str) {\n  // Write your solution here\n}\n',
        testCases: [
          { input: '"hello"', expectedOutput: '"olleh"', isHidden: false },
          { input: '"vision"', expectedOutput: '"noisiv"', isHidden: false },
          { input: '"openai"', expectedOutput: '"ianepo"', isHidden: true }
        ]
      }
    ]
  });

  await exam.save();
  console.log(`✅ Successfully seeded new Exam: ${exam.title}`);
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
