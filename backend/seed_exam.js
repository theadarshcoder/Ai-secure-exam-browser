require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Exam = require('./src/models/Exam');

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Connection error:', err));

const createExam = async () => {
  try {
    const user = await User.findOne({ role: { $in: ['mentor', 'admin'] } });
    if (!user) {
      console.error('No mentor or admin user found to create the exam.');
      process.exit(1);
    }

    const questions = [];
    
    // 10 MCQs
    for (let i = 1; i <= 10; i++) {
      questions.push({
        type: 'mcq',
        title: `MCQ Question ${i}`,
        questionText: `This is a sample multiple choice question number ${i}. Which option is correct?`,
        marks: 2,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctOption: Math.floor(Math.random() * 4)
      });
    }

    // 5 Short Answer
    for (let i = 1; i <= 5; i++) {
      questions.push({
        type: 'short',
        title: `Short Answer Question ${i}`,
        questionText: `Describe the concept of X for question number ${i}.`,
        marks: 5,
        expectedAnswer: `The concept of X involves a detailed process.`,
        maxWords: 100
      });
    }

    // 5 Coding
    for (let i = 1; i <= 5; i++) {
      questions.push({
        type: 'coding',
        title: `Coding Question ${i}`,
        questionText: `Write a JavaScript function to solve problem number ${i}.`,
        marks: 10,
        language: 'javascript',
        initialCode: 'function solve() {\n  // write your code here\n}',
        testCases: [
          { input: '1 2', expectedOutput: '3', isHidden: false },
          { input: '5 5', expectedOutput: '10', isHidden: true }
        ]
      });
    }

    const exam = new Exam({
      title: 'Comprehensive Final Exam (20 Questions)',
      description: 'An exam containing 10 MCQs, 5 Short Answer, and 5 Coding questions.',
      category: 'General',
      duration: 120, // 2 hours
      totalMarks: (10 * 2) + (5 * 5) + (5 * 10), // 20 + 25 + 50 = 95
      passingMarks: 40,
      questions: questions,
      creator: user._id,
      status: 'published',
      resultsPublished: false
    });

    await exam.save();
    console.log(`Exam created successfully! ID: ${exam._id}`);
    
  } catch (err) {
    console.error('Error creating exam:', err);
  } finally {
    mongoose.connection.close();
  }
};

createExam();
