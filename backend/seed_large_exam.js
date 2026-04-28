require('dotenv').config();
const mongoose = require('mongoose');
const Exam = require('./src/models/Exam');
const User = require('./src/models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://Vision:Vinit123%4088@visionbrowser.4vybepv.mongodb.net/?appName=VisionBrowser';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to DB');

  let creator = await User.findOne({ role: { $in: ['admin', 'mentor', 'super_mentor'] } });
  if (!creator) { console.error('❌ No admin/mentor found.'); process.exit(1); }
  console.log(`👤 Using creator: ${creator.name} (${creator.role})`);

  const exam = new Exam({
    title: 'Full Stack Engineering — Comprehensive Assessment',
    description: 'A thorough 120-minute assessment covering Data Structures, Algorithms, JavaScript, React, Node.js, Databases, and System Design. Contains 50 MCQs, 5 short-answer questions, and 5 coding challenges.',
    category: 'Computer Science',
    duration: 120,
    totalMarks: 350,  // 50×3 + 5×10 + 5×20 = 150 + 50 + 100
    passingMarks: 175,
    creator: creator._id,
    status: 'published',
    questions: [

      // ─────────────────────────────────────────────────────────────
      // 5 CODING QUESTIONS
      // ─────────────────────────────────────────────────────────────
      {
        type: 'coding',
        questionText: 'Write a function <code>reverseString(s)</code> that returns the reversed version of the input string.',
        marks: 20,
        language: 'javascript',
        initialCode: 'function reverseString(s) {\n  // Write your solution here\n}\n',
        testCases: [
          { input: '"hello"',   expectedOutput: '"olleh"',  isHidden: false },
          { input: '"vision"',  expectedOutput: '"noisiv"', isHidden: false },
          { input: '"abcde"',   expectedOutput: '"edcba"',  isHidden: true  },
          { input: '""',        expectedOutput: '""',       isHidden: true  },
        ]
      },
      {
        type: 'coding',
        questionText: 'Write a function <code>factorial(n)</code> that returns the factorial of a non-negative integer <code>n</code>. For example, <code>factorial(5)</code> returns <code>120</code>.',
        marks: 20,
        language: 'javascript',
        initialCode: 'function factorial(n) {\n  // Write your solution here\n}\n',
        testCases: [
          { input: '5',  expectedOutput: '120', isHidden: false },
          { input: '0',  expectedOutput: '1',   isHidden: false },
          { input: '1',  expectedOutput: '1',   isHidden: true  },
          { input: '10', expectedOutput: '3628800', isHidden: true },
        ]
      },
      {
        type: 'coding',
        questionText: 'Write a function <code>isPrime(n)</code> that returns <code>true</code> if <code>n</code> is a prime number, and <code>false</code> otherwise.',
        marks: 20,
        language: 'javascript',
        initialCode: 'function isPrime(n) {\n  // Write your solution here\n}\n',
        testCases: [
          { input: '7',  expectedOutput: 'true',  isHidden: false },
          { input: '4',  expectedOutput: 'false', isHidden: false },
          { input: '1',  expectedOutput: 'false', isHidden: true  },
          { input: '13', expectedOutput: 'true',  isHidden: true  },
        ]
      },
      {
        type: 'coding',
        questionText: 'Write a function <code>findMax(arr)</code> that returns the largest number in an array of integers.',
        marks: 20,
        language: 'javascript',
        initialCode: 'function findMax(arr) {\n  // Write your solution here\n}\n',
        testCases: [
          { input: '[3, 1, 4, 1, 5, 9]', expectedOutput: '9',   isHidden: false },
          { input: '[-5, -1, -3]',        expectedOutput: '-1',  isHidden: false },
          { input: '[100]',               expectedOutput: '100', isHidden: true  },
          { input: '[7, 7, 7]',           expectedOutput: '7',   isHidden: true  },
        ]
      },
      {
        type: 'coding',
        questionText: 'Write a function <code>countVowels(s)</code> that returns the number of vowels (a, e, i, o, u — case-insensitive) in a string.',
        marks: 20,
        language: 'javascript',
        initialCode: 'function countVowels(s) {\n  // Write your solution here\n}\n',
        testCases: [
          { input: '"hello"',        expectedOutput: '2', isHidden: false },
          { input: '"JavaScript"',   expectedOutput: '3', isHidden: false },
          { input: '"aeiou"',        expectedOutput: '5', isHidden: true  },
          { input: '"rhythm"',       expectedOutput: '0', isHidden: true  },
        ]
      },

      // ─────────────────────────────────────────────────────────────
      // 5 SHORT ANSWER QUESTIONS
      // ─────────────────────────────────────────────────────────────
      {
        type: 'short',
        questionText: 'Explain the difference between <strong>synchronous</strong> and <strong>asynchronous</strong> programming in JavaScript. Give one real-world example of each.',
        marks: 10,
      },
      {
        type: 'short',
        questionText: 'What is the difference between <strong>SQL</strong> and <strong>NoSQL</strong> databases? When would you choose one over the other?',
        marks: 10,
      },
      {
        type: 'short',
        questionText: 'Describe the concept of <strong>RESTful APIs</strong>. What are the key HTTP methods used and what does each represent?',
        marks: 10,
      },
      {
        type: 'short',
        questionText: 'What is <strong>Big O notation</strong>? Explain O(1), O(n), and O(n²) with simple examples.',
        marks: 10,
      },
      {
        type: 'short',
        questionText: 'What is the difference between <strong>authentication</strong> and <strong>authorization</strong>? How does JWT (JSON Web Token) help with these?',
        marks: 10,
      },

      // ─────────────────────────────────────────────────────────────
      // 50 MCQ QUESTIONS
      // ─────────────────────────────────────────────────────────────

      // JavaScript (10)
      { type: 'mcq', questionText: 'Which keyword declares a block-scoped variable in JavaScript?', marks: 3, options: ['var', 'let', 'define', 'set'], correctAnswer: 'let' },
      { type: 'mcq', questionText: 'What does <code>typeof null</code> return in JavaScript?', marks: 3, options: ['"null"', '"undefined"', '"object"', '"boolean"'], correctAnswer: '"object"' },
      { type: 'mcq', questionText: 'Which method removes the last element from an array?', marks: 3, options: ['shift()', 'pop()', 'splice()', 'slice()'], correctAnswer: 'pop()' },
      { type: 'mcq', questionText: 'What is the output of <code>console.log(0.1 + 0.2 === 0.3)</code>?', marks: 3, options: ['true', 'false', 'undefined', 'NaN'], correctAnswer: 'false' },
      { type: 'mcq', questionText: 'Which of the following is NOT a JavaScript data type?', marks: 3, options: ['Symbol', 'BigInt', 'Float', 'undefined'], correctAnswer: 'Float' },
      { type: 'mcq', questionText: 'What does the <code>===</code> operator check?', marks: 3, options: ['Value only', 'Type only', 'Value and type', 'Reference'], correctAnswer: 'Value and type' },
      { type: 'mcq', questionText: 'Which method is used to convert a JSON string to a JavaScript object?', marks: 3, options: ['JSON.parse()', 'JSON.stringify()', 'JSON.convert()', 'JSON.decode()'], correctAnswer: 'JSON.parse()' },
      { type: 'mcq', questionText: 'What is a closure in JavaScript?', marks: 3, options: ['A loop that never ends', 'A function with access to its outer scope', 'An object method', 'A promise handler'], correctAnswer: 'A function with access to its outer scope' },
      { type: 'mcq', questionText: 'Which Array method creates a new array with results of calling a function on every element?', marks: 3, options: ['forEach()', 'filter()', 'map()', 'reduce()'], correctAnswer: 'map()' },
      { type: 'mcq', questionText: 'What is the purpose of <code>async/await</code> in JavaScript?', marks: 3, options: ['To create loops', 'To handle asynchronous code more readably', 'To define classes', 'To import modules'], correctAnswer: 'To handle asynchronous code more readably' },

      // Data Structures (10)
      { type: 'mcq', questionText: 'Which data structure follows the LIFO (Last In First Out) principle?', marks: 3, options: ['Queue', 'Stack', 'Linked List', 'Tree'], correctAnswer: 'Stack' },
      { type: 'mcq', questionText: 'What is the time complexity of binary search?', marks: 3, options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'], correctAnswer: 'O(log n)' },
      { type: 'mcq', questionText: 'Which data structure is used in BFS (Breadth First Search)?', marks: 3, options: ['Stack', 'Queue', 'Heap', 'Tree'], correctAnswer: 'Queue' },
      { type: 'mcq', questionText: 'What is the worst-case time complexity of QuickSort?', marks: 3, options: ['O(n log n)', 'O(n)', 'O(n²)', 'O(log n)'], correctAnswer: 'O(n²)' },
      { type: 'mcq', questionText: 'In a linked list, what does the last node point to?', marks: 3, options: ['First node', 'Itself', 'null', 'Middle node'], correctAnswer: 'null' },
      { type: 'mcq', questionText: 'Which of the following is a balanced binary search tree?', marks: 3, options: ['AVL Tree', 'Binary Tree', 'Trie', 'Heap'], correctAnswer: 'AVL Tree' },
      { type: 'mcq', questionText: 'What is the space complexity of merge sort?', marks: 3, options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], correctAnswer: 'O(n)' },
      { type: 'mcq', questionText: 'A hash table provides which average-case lookup time?', marks: 3, options: ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'], correctAnswer: 'O(1)' },
      { type: 'mcq', questionText: 'Which traversal visits nodes in Left → Root → Right order?', marks: 3, options: ['Preorder', 'Postorder', 'Inorder', 'Level-order'], correctAnswer: 'Inorder' },
      { type: 'mcq', questionText: 'What data structure is used to implement function call management in programs?', marks: 3, options: ['Queue', 'Heap', 'Stack', 'Graph'], correctAnswer: 'Stack' },

      // Web / HTML / CSS (8)
      { type: 'mcq', questionText: 'What does CSS stand for?', marks: 3, options: ['Computer Style Sheets', 'Cascading Style Sheets', 'Creative Style System', 'Colorful Style Sheets'], correctAnswer: 'Cascading Style Sheets' },
      { type: 'mcq', questionText: 'Which HTML tag is used to link an external CSS file?', marks: 3, options: ['<style>', '<script>', '<link>', '<css>'], correctAnswer: '<link>' },
      { type: 'mcq', questionText: 'What is the default display value of a <code>&lt;div&gt;</code> element?', marks: 3, options: ['inline', 'block', 'flex', 'grid'], correctAnswer: 'block' },
      { type: 'mcq', questionText: 'Which CSS property controls the space between an element\'s content and its border?', marks: 3, options: ['margin', 'padding', 'spacing', 'border-gap'], correctAnswer: 'padding' },
      { type: 'mcq', questionText: 'Which HTTP method is used to send data to a server to create a resource?', marks: 3, options: ['GET', 'PUT', 'POST', 'DELETE'], correctAnswer: 'POST' },
      { type: 'mcq', questionText: 'What does the HTML <code>alt</code> attribute on an <code>&lt;img&gt;</code> tag specify?', marks: 3, options: ['Image alignment', 'Alternative text if image fails', 'Image size', 'Image source'], correctAnswer: 'Alternative text if image fails' },
      { type: 'mcq', questionText: 'Which CSS selector selects all elements with class "highlight"?', marks: 3, options: ['#highlight', '.highlight', '*highlight', '!highlight'], correctAnswer: '.highlight' },
      { type: 'mcq', questionText: 'What does <code>position: absolute</code> do in CSS?', marks: 3, options: ['Positions relative to viewport', 'Positions relative to nearest positioned ancestor', 'Removes from flow permanently', 'Positions at top-left of page'], correctAnswer: 'Positions relative to nearest positioned ancestor' },

      // React (8)
      { type: 'mcq', questionText: 'What hook is used to manage state in a React functional component?', marks: 3, options: ['useEffect', 'useContext', 'useState', 'useRef'], correctAnswer: 'useState' },
      { type: 'mcq', questionText: 'What does the <code>useEffect</code> hook with an empty dependency array <code>[]</code> do?', marks: 3, options: ['Runs on every render', 'Runs only on unmount', 'Runs once after mount', 'Runs before render'], correctAnswer: 'Runs once after mount' },
      { type: 'mcq', questionText: 'What is the virtual DOM in React?', marks: 3, options: ['A server-side DOM', 'A lightweight JavaScript copy of the real DOM', 'A CSS framework', 'A database layer'], correctAnswer: 'A lightweight JavaScript copy of the real DOM' },
      { type: 'mcq', questionText: 'How do you pass data from a parent to a child component in React?', marks: 3, options: ['State', 'Context only', 'Props', 'Redux only'], correctAnswer: 'Props' },
      { type: 'mcq', questionText: 'Which file is the entry point for a typical Create React App project?', marks: 3, options: ['index.html', 'App.jsx', 'index.js', 'main.js'], correctAnswer: 'index.js' },
      { type: 'mcq', questionText: 'What is the purpose of the <code>key</code> prop when rendering lists in React?', marks: 3, options: ['To apply CSS', 'To help React identify which items changed', 'To pass data to children', 'To create refs'], correctAnswer: 'To help React identify which items changed' },
      { type: 'mcq', questionText: 'Which hook would you use to access a DOM element directly in React?', marks: 3, options: ['useState', 'useRef', 'useMemo', 'useCallback'], correctAnswer: 'useRef' },
      { type: 'mcq', questionText: 'What is React Router used for?', marks: 3, options: ['State management', 'API calls', 'Client-side navigation', 'Styling components'], correctAnswer: 'Client-side navigation' },

      // Node.js / Express / Databases (8)
      { type: 'mcq', questionText: 'What is Node.js?', marks: 3, options: ['A browser', 'A JavaScript runtime built on Chrome V8', 'A CSS preprocessor', 'A database'], correctAnswer: 'A JavaScript runtime built on Chrome V8' },
      { type: 'mcq', questionText: 'Which Node.js module is used to create an HTTP server natively?', marks: 3, options: ['fs', 'path', 'http', 'os'], correctAnswer: 'http' },
      { type: 'mcq', questionText: 'What does <code>npm</code> stand for?', marks: 3, options: ['Node Package Manager', 'New Project Manager', 'Node Program Module', 'Nested Package Method'], correctAnswer: 'Node Package Manager' },
      { type: 'mcq', questionText: 'In Express.js, which method defines a route for GET requests?', marks: 3, options: ['app.post()', 'app.use()', 'app.get()', 'app.route()'], correctAnswer: 'app.get()' },
      { type: 'mcq', questionText: 'What is MongoDB?', marks: 3, options: ['A relational database', 'A document-oriented NoSQL database', 'A graph database', 'A key-value store'], correctAnswer: 'A document-oriented NoSQL database' },
      { type: 'mcq', questionText: 'Which SQL clause filters records based on a condition?', marks: 3, options: ['ORDER BY', 'GROUP BY', 'WHERE', 'HAVING'], correctAnswer: 'WHERE' },
      { type: 'mcq', questionText: 'What is middleware in Express.js?', marks: 3, options: ['A database model', 'A function that runs between request and response', 'A type of route', 'A testing tool'], correctAnswer: 'A function that runs between request and response' },
      { type: 'mcq', questionText: 'What does <code>mongoose.connect()</code> do?', marks: 3, options: ['Creates a new collection', 'Connects Node.js app to MongoDB', 'Starts an HTTP server', 'Validates schemas'], correctAnswer: 'Connects Node.js app to MongoDB' },

      // General CS / System Design (6)
      { type: 'mcq', questionText: 'What does API stand for?', marks: 3, options: ['Application Programming Interface', 'Advanced Program Interaction', 'Automated Process Integration', 'Applied Program Index'], correctAnswer: 'Application Programming Interface' },
      { type: 'mcq', questionText: 'What is the purpose of a CDN (Content Delivery Network)?', marks: 3, options: ['Store databases', 'Deliver content faster by serving from nearby servers', 'Manage DNS records', 'Handle authentication'], correctAnswer: 'Deliver content faster by serving from nearby servers' },
      { type: 'mcq', questionText: 'What does HTTPS stand for?', marks: 3, options: ['Hyper Transfer Protocol Secure', 'HyperText Transfer Protocol Secure', 'High Transfer Protocol System', 'HyperText Transport Protocol Standard'], correctAnswer: 'HyperText Transfer Protocol Secure' },
      { type: 'mcq', questionText: 'What is a 404 HTTP status code?', marks: 3, options: ['Server Error', 'Unauthorized', 'Not Found', 'Forbidden'], correctAnswer: 'Not Found' },
      { type: 'mcq', questionText: 'Which design pattern does MVC stand for?', marks: 3, options: ['Module View Controller', 'Model View Controller', 'Method View Component', 'Model View Component'], correctAnswer: 'Model View Controller' },
      { type: 'mcq', questionText: 'What is Git primarily used for?', marks: 3, options: ['Hosting websites', 'Version control and tracking code changes', 'Deploying applications', 'Managing databases'], correctAnswer: 'Version control and tracking code changes' },
    ]
  });

  await exam.save();
  console.log(`✅ Exam created: "${exam.title}" (ID: ${exam._id})`);
  console.log(`   📝 Questions: 50 MCQ + 5 Short + 5 Coding = 60 total`);
  console.log(`   ⏱  Duration: 120 minutes`);
  console.log(`   🏆 Total Marks: 350 | Passing: 175`);
  process.exit(0);
}

seed().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
