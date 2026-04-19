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

        await Exam.deleteMany({ title: 'Full Stack Engineering — Proctored Assessment' });
        console.log('🧹 Cleared previous exam with the same title (if any).');

        // Start 5 minutes ago so the exam is immediately LIVE
        const startTime = new Date(Date.now() - 5 * 60 * 1000);

        const exam = new Exam({
            title: 'Full Stack Engineering — Proctored Assessment',
            description: 'A comprehensive proctored exam covering JavaScript fundamentals, React concepts, Node.js patterns, and algorithmic problem solving.',
            category: 'Full Stack Development',
            duration: 120,          // 2 hours
            totalMarks: 100,
            passingMarks: 50,
            status: 'published',
            resultsPublished: false,
            scheduledDate: startTime,
            creator: admin._id,
            questions: [

                // ── 5 MCQs ─────────────────────────────────────────────
                {
                    type: 'mcq',
                    questionText: 'Which of the following correctly describes the output of `console.log(0.1 + 0.2 === 0.3)` in JavaScript?',
                    marks: 5,
                    options: [
                        'true, because 0.1 + 0.2 equals 0.3',
                        'false, due to floating-point precision errors',
                        'undefined, because === is not valid for numbers',
                        'SyntaxError is thrown'
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
                    questionText: 'Which React hook would you use to memoize an expensive computed value and recompute it only when its dependencies change?',
                    marks: 5,
                    options: ['useCallback', 'useMemo', 'useRef', 'useReducer'],
                    correctOption: 1
                },
                {
                    type: 'mcq',
                    questionText: 'In a MongoDB document, what does the `$set` operator do in an update operation?',
                    marks: 5,
                    options: [
                        'Replaces the entire document with the given fields',
                        'Updates or adds only the specified fields without affecting others',
                        'Deletes the specified field from the document',
                        'Sets a field as read-only'
                    ],
                    correctOption: 1
                },
                {
                    type: 'mcq',
                    questionText: 'What does the `event.stopPropagation()` method do in a browser event handler?',
                    marks: 5,
                    options: [
                        'Prevents the default browser action (e.g. form submission)',
                        'Stops the event from bubbling up to parent elements',
                        'Removes all event listeners from the element',
                        'Cancels the event entirely and throws an error'
                    ],
                    correctOption: 1
                },

                // ── 2 Short Answers ────────────────────────────────────
                {
                    type: 'short',
                    questionText: 'Explain the concept of the JavaScript Event Loop and why it is critical for non-blocking I/O operations.',
                    marks: 15,
                    expectedAnswer: 'The JavaScript Event Loop is a mechanism that continuously monitors the call stack and the callback/task queues. Because JavaScript is single-threaded, it cannot perform multiple operations simultaneously. When an asynchronous operation (like setTimeout, fetch, or file I/O) completes, its callback is placed in the queue. The Event Loop picks up callbacks from the queue and pushes them onto the call stack only when it is empty, allowing non-blocking behaviour without needing multiple threads.'
                },
                {
                    type: 'short',
                    questionText: 'What is the difference between authentication and authorization in a web application? Give a concrete example of each.',
                    marks: 15,
                    expectedAnswer: 'Authentication is the process of verifying who a user is (e.g. checking a username + password against the database and issuing a JWT token). Authorization is the process of verifying what that authenticated user is allowed to do (e.g. checking that a JWT has the "admin" role before allowing access to the /admin/users endpoint). Authentication answers "Who are you?" while authorization answers "What are you allowed to do?"'
                },

                // ── 3 Coding Questions ─────────────────────────────────
                {
                    type: 'coding',
                    questionText: `Given a list of integers, return all pairs of numbers whose sum equals a given target.\n\nExample:\n  Input: nums = [2, 7, 4, 1, 3], target = 9\n  Output: [[2, 7]]\n\nEach pair should appear once (in the order they appear in the array). Don't include duplicates.`,
                    marks: 15,
                    language: 'javascript',
                    initialCode: `function findPairs(nums, target) {\n  // Write your solution here\n  \n}\n\n// Do not modify below\nconst [nums, target] = JSON.parse(readline());\nconsole.log(JSON.stringify(findPairs(nums, target)));`,
                    testCases: [
                        { input: '[[2,7,4,1,3], 9]',  expectedOutput: '[[2,7]]',       isHidden: false },
                        { input: '[[1,5,3,4,2], 6]',  expectedOutput: '[[1,5],[2,4]]', isHidden: false },
                        { input: '[[1,2,3,4], 10]',   expectedOutput: '[]',             isHidden: true  },
                        { input: '[[-1,0,1,2,-2], 0]',expectedOutput: '[[-1,1],[-2,2]]',isHidden: true  }
                    ]
                },
                {
                    type: 'coding',
                    questionText: `Write a function \`flattenDeep(arr)\` that recursively flattens a deeply nested array into a single-level array.\n\nExample:\n  Input: [1, [2, [3, [4]], 5]]\n  Output: [1, 2, 3, 4, 5]\n\nDo NOT use Array.prototype.flat().`,
                    marks: 15,
                    language: 'javascript',
                    initialCode: `function flattenDeep(arr) {\n  // Write your solution here\n  \n}\n\n// Do not modify below\nconst arr = JSON.parse(readline());\nconsole.log(JSON.stringify(flattenDeep(arr)));`,
                    testCases: [
                        { input: '[[1,[2,[3,[4]],5]]]',    expectedOutput: '[1,2,3,4,5]',   isHidden: false },
                        { input: '[[1,2,3]]',               expectedOutput: '[1,2,3]',        isHidden: false },
                        { input: '[[[[[42]]]]]',            expectedOutput: '[42]',           isHidden: true  },
                        { input: '[[1,[2],[3,[4,[5]]]]]',   expectedOutput: '[1,2,3,4,5]',   isHidden: true  }
                    ]
                },
                {
                    type: 'coding',
                    questionText: `Implement a function \`debounce(fn, delay)\` that returns a debounced version of \`fn\`. The debounced function should only execute after \`delay\` milliseconds have elapsed since the last time it was called.\n\nFor this problem, simulate debounce behaviour using timestamps (no real setTimeout needed).\n\nYour function should:\n- Track the last call time\n- Return the result of fn() only if delay ms have passed since the last call\n- Return null otherwise\n\n(Hint: Use Date.now() for timing)`,
                    marks: 20,
                    language: 'javascript',
                    initialCode: `function debounce(fn, delay) {\n  // Write your solution here\n  \n}\n\n// Do not modify below — example usage\nconst add = (a, b) => a + b;\nconst debounced = debounce(add, 300);\nconsole.log(debounced(1, 2)); // null (first call, not enough time passed — treat first call as immediate)\nconsole.log(debounced(1, 2)); // null (called again immediately)`,
                    testCases: [
                        { input: 'debounce_basic',    expectedOutput: '3',    isHidden: false },
                        { input: 'debounce_rapid',    expectedOutput: 'null', isHidden: true  },
                        { input: 'debounce_delayed',  expectedOutput: '10',   isHidden: true  }
                    ]
                }
            ]
        });

        await exam.save();

        const totalMarks = exam.questions.reduce((s, q) => s + q.marks, 0);

        console.log('\n========================================');
        console.log('  FULL STACK EXAM SEEDED SUCCESSFULLY');
        console.log('========================================');
        console.log(`  Title      →  ${exam.title}`);
        console.log(`  Status     →  ${exam.status}`);
        console.log(`  StartTime  →  ${startTime.toLocaleString()}`);
        console.log(`  Duration   →  ${exam.duration} min`);
        console.log(`  Questions  →  ${exam.questions.length}  (5 MCQ · 2 Short · 3 Coding)`);
        console.log(`  Total Marks→  ${totalMarks}`);
        console.log('========================================\n');

        process.exit(0);
    } catch (e) {
        console.error('❌ Seeding failed:', e.message);
        process.exit(1);
    }
};

seed();
