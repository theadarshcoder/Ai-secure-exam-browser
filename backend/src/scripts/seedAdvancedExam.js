const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const User = require('../models/User');
require('dotenv').config();

const seedAdvancedExam = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database.');

        // Find the admin user to use as creator
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.error('❌ No admin user found. Run seedTestUsers.js first.');
            process.exit(1);
        }

        // Remove any previously seeded advanced test exams
        await Exam.deleteMany({ title: 'Advanced Exam — Hybrid Format' });
        console.log('🧹 Cleared old advanced exam (if any).');

        // startTime = 10 mins ago so the exam is currently LIVE
        const startTime = new Date(Date.now() - 10 * 60 * 1000);

        const exam = new Exam({
            title: 'Advanced Exam — Hybrid Format',
            description: 'Comprehensive test featuring MCQs, short answers, and live coding challenges.',
            category: 'Full Stack Development',
            duration: 150,           // 2.5 hours
            totalMarks: 65,
            passingMarks: 30,
            status: 'published',
            resultsPublished: false,
            scheduledDate: startTime,
            creator: admin._id,
            questions: [
                // 3 MCQs
                {
                    type: 'mcq',
                    questionText: 'Which property is used in CSS to pull an element out of the normal flow and make it float?',
                    marks: 5,
                    options: ['align', 'float', 'scroll', 'position'],
                    correctOption: 1
                },
                {
                    type: 'mcq',
                    questionText: 'What does the JavaScript expression `typeof null` evaluate to?',
                    marks: 5,
                    options: ['"null"', '"undefined"', '"object"', '"number"'],
                    correctOption: 2
                },
                {
                    type: 'mcq',
                    questionText: 'Which React hook is meant to run side effects in a functional component?',
                    marks: 5,
                    options: ['useEffect', 'useState', 'useSideEffect', 'useImperativeHandle'],
                    correctOption: 0
                },
                // 2 Short Answers
                {
                    type: 'short',
                    questionText: 'Briefly explain the primary difference between `let` and `const` declarations in JavaScript.',
                    marks: 10,
                    expectedAnswer: 'Both are block-scoped, but variables declared with `let` can be reassigned, whereas variables declared with `const` cannot be reassigned (though objects/arrays assigned to const can be mutated).'
                },
                {
                    type: 'short',
                    questionText: 'What is a Higher-Order Component (HOC) in React?',
                    marks: 10,
                    expectedAnswer: 'A Higher-Order Component (HOC) is an advanced technique in React for reusing component logic. It is a function that takes a component and returns a new component, wrapping it with additional injected props or logic.'
                },
                // 2 Coding Questions
                {
                    type: 'coding',
                    questionText: 'Given an array of numbers, return the maximum number in the array. Note: Do not use the built-in Math.max() method.',
                    marks: 15,
                    language: 'javascript',
                    initialCode: 'function findMax(arr) {\n  // Write your logic here\n  \n}',
                    testCases: [
                        { input: '[1, 5, 3, 9, 2]', expectedOutput: '9', isHidden: false },
                        { input: '[-1, -5, -3]', expectedOutput: '-1', isHidden: true },
                        { input: '[100]', expectedOutput: '100', isHidden: true }
                    ]
                },
                {
                    type: 'coding',
                    questionText: 'Write a function that reverses a given string and returns the reversed string.',
                    marks: 15,
                    language: 'javascript',
                    initialCode: 'function reverseString(str) {\n  // Write your logic here\n  \n}',
                    testCases: [
                        { input: '"hello"', expectedOutput: '"olleh"', isHidden: false },
                        { input: '"OpenAI"', expectedOutput: '"IAnepO"', isHidden: true },
                        { input: '""', expectedOutput: '""', isHidden: true }
                    ]
                }
            ]
        });

        await exam.save();

        console.log('\n========================================');
        console.log('  ADVANCED EXAM SEEDED SUCCESSFULLY');
        console.log('========================================');
        console.log(`  Title     →  ${exam.title}`);
        console.log(`  Status    →  ${exam.status}`);
        console.log(`  StartTime →  ${startTime.toLocaleString()}`);
        console.log(`  Duration  →  ${exam.duration} min`);
        console.log(`  Questions →  ${exam.questions.length}`);
        console.log('========================================\n');

        process.exit(0);
    } catch (e) {
        console.error('❌ Seeding failed:', e.message);
        process.exit(1);
    }
};

seedAdvancedExam();
