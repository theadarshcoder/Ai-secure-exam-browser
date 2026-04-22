const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const User = require('../models/User');
require('dotenv').config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database.');

        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.error('❌ No admin user found. Run seedTestUsers.js first.');
            process.exit(1);
        }

        await Exam.deleteMany({ title: 'Standard Assessment — 3 MCQ, 2 Short, 2 Coding' });
        console.log('🧹 Cleared previous exam with the same title (if any).');

        // Start 5 minutes ago so the exam is immediately LIVE
        const startTime = new Date(Date.now() - 5 * 60 * 1000);

        const exam = new Exam({
            title: 'Standard Assessment — 3 MCQ, 2 Short, 2 Coding',
            description: 'A custom proctored exam containing 3 multiple choice, 2 short answer, and 2 coding questions.',
            category: 'General Programming',
            duration: 60,          // 1 hour
            totalMarks: 75,
            passingMarks: 35,
            status: 'published',
            resultsPublished: false,
            scheduledDate: startTime,
            creator: admin._id,
            questions: [
                // ── 3 MCQs ─────────────────────────────────────────────
                {
                    type: 'mcq',
                    questionText: 'Which of the following describes the output of `typeof null` in JavaScript?',
                    marks: 5,
                    options: [
                        '"null"',
                        '"object"',
                        '"undefined"',
                        'ReferenceError is thrown'
                    ],
                    correctOption: 1
                },
                {
                    type: 'mcq',
                    questionText: 'What is the correct HTTP status code to return when a resource is successfully created via a POST request?',
                    marks: 5,
                    options: ['200 OK', '204 No Content', '201 Created', '302 Found'],
                    correctOption: 2
                },
                {
                    type: 'mcq',
                    questionText: 'Which React hook would you use to reference a DOM node without causing a re-render?',
                    marks: 5,
                    options: ['useCallback', 'useMemo', 'useRef', 'useEffect'],
                    correctOption: 2
                },

                // ── 2 Short Answers ────────────────────────────────────
                {
                    type: 'short',
                    questionText: 'Explain the concept of the closure in JavaScript.',
                    marks: 15,
                    expectedAnswer: 'A closure is the combination of a function bundled together (enclosed) with references to its surrounding state (the lexical environment). In other words, a closure gives you access to an outer function\'s scope from an inner function. In JavaScript, closures are created every time a function is created, at function creation time.'
                },
                {
                    type: 'short',
                    questionText: 'What is the difference between single-page applications (SPAs) and traditional multi-page applications?',
                    marks: 15,
                    expectedAnswer: 'A single-page application interacts with the user by dynamically rewriting the current web page with new data from the web server, instead of the default method of a web browser loading entire new pages. The goal is faster transitions that make the website feel more like a native app.'
                },

                // ── 2 Coding Questions ─────────────────────────────────
                {
                    type: 'coding',
                    questionText: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`. You may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nExample:\n  Input: nums = [2, 7, 11, 15], target = 9\n  Output: [0, 1]`,
                    marks: 15,
                    language: 'javascript',
                    initialCode: `function twoSum(nums, target) {\n  // Write your solution here\n  \n}\n\n// Do not modify below\nconst [nums, target] = JSON.parse(readline());\nconsole.log(JSON.stringify(twoSum(nums, target)));`,
                    testCases: [
                        { input: '[[2,7,11,15], 9]',  expectedOutput: '[0,1]',       isHidden: false },
                        { input: '[[3,2,4], 6]',      expectedOutput: '[1,2]',       isHidden: false },
                        { input: '[[3,3], 6]',        expectedOutput: '[0,1]',       isHidden: true  }
                    ]
                },
                {
                    type: 'coding',
                    questionText: `Write a function \`reverseString(s)\` that reverses a string passed to it.\n\nExample:\n  Input: "hello"\n  Output: "olleh"`,
                    marks: 15,
                    language: 'javascript',
                    initialCode: `function reverseString(s) {\n  // Write your solution here\n  \n}\n\n// Do not modify below\nconst str = JSON.parse(readline());\nconsole.log(JSON.stringify(reverseString(str)));`,
                    testCases: [
                        { input: '["hello"]',         expectedOutput: '"olleh"',     isHidden: false },
                        { input: '["Google"]',        expectedOutput: '"elgooG"',    isHidden: false },
                        { input: '["a"]',             expectedOutput: '"a"',         isHidden: true  },
                        { input: '["racecar"]',       expectedOutput: '"racecar"',   isHidden: true  }
                    ]
                }
            ]
        });

        await exam.save();

        const totalMarks = exam.questions.reduce((s, q) => s + q.marks, 0);

        console.log('\n========================================');
        console.log('  CUSTOM EXAM SEEDED SUCCESSFULLY');
        console.log('========================================');
        console.log(`  Title      →  ${exam.title}`);
        console.log(`  Status     →  ${exam.status}`);
        console.log(`  StartTime  →  ${startTime.toLocaleString()}`);
        console.log(`  Duration   →  ${exam.duration} min`);
        console.log(`  Questions  →  ${exam.questions.length}  (3 MCQ · 2 Short · 2 Coding)`);
        console.log(`  Total Marks→  ${totalMarks}`);
        console.log('========================================\n');

        process.exit(0);
    } catch (e) {
        console.error('❌ Seeding failed:', e.message);
        process.exit(1);
    }
};

seed();
