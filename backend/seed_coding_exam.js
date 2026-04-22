require('dotenv').config();
const mongoose = require('mongoose');
const Exam = require('./src/models/Exam');
const User = require('./src/models/User');

const MONGO_URI = 'mongodb+srv://Vision:Vinit123%4088@visionbrowser.4vybepv.mongodb.net/?appName=VisionBrowser';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB');

  // Find an admin or mentor to be the creator
  let creator = await User.findOne({ role: { $in: ['admin', 'mentor'] } });
  
  if (!creator) {
      console.log('No admin/mentor found, creating a dummy user');
      creator = await User.create({
          name: 'System Admin',
          email: 'admin@vision.com',
          password: 'hashedpassword',
          role: 'admin'
      });
  }

  const newExam = new Exam({
      title: 'Advanced Computer Science & Algorithms',
      description: 'A comprehensive coding assessment featuring 5 complex algorithms.',
      category: 'Computer Science',
      duration: 120,
      totalMarks: 50,
      passingMarks: 20,
      creator: creator._id,
      status: 'published',
      questions: [
          {
              type: 'coding',
              questionText: 'Write a function <code>twoSum(nums, target)</code> that returns indices of the two numbers such that they add up to the target.',
              marks: 10,
              language: 'javascript',
              initialCode: 'function twoSum(nums, target) {\n  // Write your code here\n}\n',
              testCases: [
                  { input: '[2, 7, 11, 15]|9', expectedOutput: '[0, 1]', isHidden: false },
                  { input: '[3, 2, 4]|6', expectedOutput: '[1, 2]', isHidden: true },
              ]
          },
          {
              type: 'coding',
              questionText: 'Write a function <code>reverseString(s)</code> that reverses a string.',
              marks: 10,
              language: 'javascript',
              initialCode: 'function reverseString(s) {\n  // Write your code here\n}\n',
              testCases: [
                  { input: '"hello"', expectedOutput: '"olleh"', isHidden: false },
                  { input: '"Vision"', expectedOutput: '"noisiV"', isHidden: true },
              ]
          },
          {
              type: 'coding',
              questionText: 'Write a function <code>isPalindrome(str)</code> that returns true if a string (in lowercase without spaces) is a palindrome, false otherwise.',
              marks: 10,
              language: 'javascript',
              initialCode: 'function isPalindrome(str) {\n  // Write your code here\n}\n',
              testCases: [
                  { input: '"racecar"', expectedOutput: 'true', isHidden: false },
                  { input: '"hello"', expectedOutput: 'false', isHidden: false },
                  { input: '"madam"', expectedOutput: 'true', isHidden: true }
              ]
          },
          {
              type: 'coding',
              questionText: 'Write a function <code>factorial(n)</code> to calculate the factorial of a positive integer n.',
              marks: 10,
              language: 'javascript',
              initialCode: 'function factorial(n) {\n  // Write your code here\n}\n',
              testCases: [
                  { input: '5', expectedOutput: '120', isHidden: false },
                  { input: '0', expectedOutput: '1', isHidden: false },
                  { input: '7', expectedOutput: '5040', isHidden: true }
              ]
          },
          {
              type: 'coding',
              questionText: 'Write a function <code>findMax(arr)</code> to find the maximum number in an array.',
              marks: 10,
              language: 'javascript',
              initialCode: 'function findMax(arr) {\n  // Write your code here\n}\n',
              testCases: [
                  { input: '[1, 5, 3, 9, 2]', expectedOutput: '9', isHidden: false },
                  { input: '[-5, -1, -10]', expectedOutput: '-1', isHidden: true }
              ]
          }
      ]
  });

  await newExam.save();
  console.log('Successfully created new exam with 5 coding questions!');
  process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
