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
    title: 'Full Stack Developer — Demo Assessment',
    description: 'A well-rounded demo exam covering Data Structures, Programming Concepts, Web Technologies, and problem-solving skills. Contains 2 coding challenges, 20 MCQs, and 5 short-answer questions.',
    category: 'Computer Science',
    duration: 90,           // 90 minutes
    totalMarks: 175,        // 2×20 + 20×5 + 5×5 = 40 + 100 + 25 = 165 → rounded to 175
    passingMarks: 88,
    creator: creator._id,
    status: 'published',
    questions: [

      // ── 2 CODING QUESTIONS ────────────────────────────────
      {
        type: 'coding',
        questionText: 'Write a function <code>twoSum(nums, target)</code> that takes an array of integers and a target integer, and returns the <strong>indices</strong> of the two numbers that add up to the target. You may assume exactly one solution exists.',
        marks: 20,
        language: 'javascript',
        initialCode: 'function twoSum(nums, target) {\n  // Write your solution here\n}\n',
        testCases: [
          { input: '[2, 7, 11, 15]|9',  expectedOutput: '[0, 1]', isHidden: false },
          { input: '[3, 2, 4]|6',        expectedOutput: '[1, 2]', isHidden: false },
          { input: '[3, 3]|6',           expectedOutput: '[0, 1]', isHidden: true  },
          { input: '[1, 5, 3, 9]|14',    expectedOutput: '[1, 3]', isHidden: true  },
        ]
      },
      {
        type: 'coding',
        questionText: 'Write a function <code>isPalindrome(str)</code> that returns <code>true</code> if the given string (lowercase, no spaces) reads the same forwards and backwards, and <code>false</code> otherwise.',
        marks: 20,
        language: 'javascript',
        initialCode: 'function isPalindrome(str) {\n  // Write your solution here\n}\n',
        testCases: [
          { input: '"racecar"', expectedOutput: 'true',  isHidden: false },
          { input: '"hello"',   expectedOutput: 'false', isHidden: false },
          { input: '"madam"',   expectedOutput: 'true',  isHidden: true  },
          { input: '"vision"',  expectedOutput: 'false', isHidden: true  },
        ]
      },

      // ── 20 MCQ QUESTIONS ──────────────────────────────────
      {
        type: 'mcq',
        questionText: 'What does HTML stand for?',
        marks: 5,
        options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Hyper Transfer Markup Language', 'Home Tool Markup Language'],
        correctOption: 0
      },
      {
        type: 'mcq',
        questionText: 'Which data structure follows the Last In First Out (LIFO) principle?',
        marks: 5,
        options: ['Queue', 'Stack', 'Linked List', 'Tree'],
        correctOption: 1
      },
      {
        type: 'mcq',
        questionText: 'What is the time complexity of binary search?',
        marks: 5,
        options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'],
        correctOption: 2
      },
      {
        type: 'mcq',
        questionText: 'Which keyword is used to declare a constant in JavaScript?',
        marks: 5,
        options: ['var', 'let', 'const', 'static'],
        correctOption: 2
      },
      {
        type: 'mcq',
        questionText: 'Which of the following is NOT a JavaScript data type?',
        marks: 5,
        options: ['String', 'Boolean', 'Float', 'Symbol'],
        correctOption: 2
      },
      {
        type: 'mcq',
        questionText: 'In CSS, which property controls the space between an element\'s border and its content?',
        marks: 5,
        options: ['margin', 'spacing', 'padding', 'border-gap'],
        correctOption: 2
      },
      {
        type: 'mcq',
        questionText: 'What does the acronym API stand for?',
        marks: 5,
        options: ['Application Programming Interface', 'Advanced Program Integration', 'Automated Processing Input', 'Application Protocol Index'],
        correctOption: 0
      },
      {
        type: 'mcq',
        questionText: 'Which HTTP method is typically used to update an existing resource?',
        marks: 5,
        options: ['GET', 'POST', 'PUT', 'DELETE'],
        correctOption: 2
      },
      {
        type: 'mcq',
        questionText: 'What is the output of: console.log(typeof null) in JavaScript?',
        marks: 5,
        options: ['"null"', '"undefined"', '"object"', '"boolean"'],
        correctOption: 2
      },
      {
        type: 'mcq',
        questionText: 'Which sorting algorithm has an average time complexity of O(n log n)?',
        marks: 5,
        options: ['Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Selection Sort'],
        correctOption: 2
      },
      {
        type: 'mcq',
        questionText: 'Which of the following is a NoSQL database?',
        marks: 5,
        options: ['MySQL', 'PostgreSQL', 'MongoDB', 'SQLite'],
        correctOption: 2
      },
      {
        type: 'mcq',
        questionText: 'What does DNS stand for?',
        marks: 5,
        options: ['Data Network Service', 'Domain Name System', 'Dynamic Node Server', 'Distributed Name Storage'],
        correctOption: 1
      },
      {
        type: 'mcq',
        questionText: 'Which React hook is used to perform side effects in a functional component?',
        marks: 5,
        options: ['useState', 'useEffect', 'useRef', 'useCallback'],
        correctOption: 1
      },
      {
        type: 'mcq',
        questionText: 'In object-oriented programming, what is the concept of wrapping data and methods into a single unit called?',
        marks: 5,
        options: ['Inheritance', 'Polymorphism', 'Encapsulation', 'Abstraction'],
        correctOption: 2
      },
      {
        type: 'mcq',
        questionText: 'What is the primary purpose of Git?',
        marks: 5,
        options: ['Database management', 'Version control', 'Server deployment', 'Code compilation'],
        correctOption: 1
      },
      {
        type: 'mcq',
        questionText: 'Which symbol is used for single-line comments in JavaScript?',
        marks: 5,
        options: ['#', '/* */', '//', '--'],
        correctOption: 2
      },
      {
        type: 'mcq',
        questionText: 'What does the CSS property "display: flex" do?',
        marks: 5,
        options: ['Makes element invisible', 'Enables flexbox layout on the element', 'Adds a border around the element', 'Positions the element absolutely'],
        correctOption: 1
      },
      {
        type: 'mcq',
        questionText: 'Which of the following is used to store key-value pairs in Python?',
        marks: 5,
        options: ['List', 'Tuple', 'Dictionary', 'Set'],
        correctOption: 2
      },
      {
        type: 'mcq',
        questionText: 'What is the result of 5 === "5" in JavaScript?',
        marks: 5,
        options: ['true', 'false', 'undefined', 'TypeError'],
        correctOption: 1
      },
      {
        type: 'mcq',
        questionText: 'Which HTTP status code indicates a "Not Found" error?',
        marks: 5,
        options: ['200', '301', '403', '404'],
        correctOption: 3
      },

      // ── 5 SHORT ANSWER QUESTIONS ──────────────────────────
      {
        type: 'short',
        questionText: 'What is the difference between "==" and "===" in JavaScript? Give one example where they behave differently.',
        marks: 5,
        expectedAnswer: '"==" checks value equality with type coercion, while "===" checks both value and type strictly. For example, 5 == "5" is true but 5 === "5" is false.',
        maxWords: 80
      },
      {
        type: 'short',
        questionText: 'Explain what a RESTful API is and name two common HTTP methods used in REST APIs.',
        marks: 5,
        expectedAnswer: 'A RESTful API is a web service that follows REST principles — it uses HTTP methods to perform CRUD operations on resources. Common methods include GET (read data) and POST (create data).',
        maxWords: 80
      },
      {
        type: 'short',
        questionText: 'What is the purpose of the "useEffect" hook in React? When does it run?',
        marks: 5,
        expectedAnswer: 'useEffect is used for side effects in functional components such as data fetching, subscriptions, or DOM manipulation. It runs after every render by default, or conditionally when the dependency array changes.',
        maxWords: 80
      },
      {
        type: 'short',
        questionText: 'What is a primary key in a relational database? Why is it important?',
        marks: 5,
        expectedAnswer: 'A primary key is a unique identifier for each record in a database table. It ensures no two rows have the same value and is used to reference records in relationships between tables.',
        maxWords: 80
      },
      {
        type: 'short',
        questionText: 'Briefly explain the concept of "closure" in JavaScript with a simple use case.',
        marks: 5,
        expectedAnswer: 'A closure is a function that has access to its outer function\'s variables even after the outer function has returned. A common use case is a counter function that keeps track of its count across multiple calls.',
        maxWords: 100
      }
    ]
  });

  await exam.save();
  console.log('\n🎉 Demo exam created successfully!');
  console.log(`   Title    : ${exam.title}`);
  console.log(`   ID       : ${exam._id}`);
  console.log(`   Status   : ${exam.status}`);
  console.log(`   Questions: ${exam.questions.length} (2 Coding + 20 MCQ + 5 Short)`);
  console.log(`   Duration : ${exam.duration} minutes`);
  console.log(`   Marks    : ${exam.totalMarks} total, ${exam.passingMarks} to pass\n`);
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
