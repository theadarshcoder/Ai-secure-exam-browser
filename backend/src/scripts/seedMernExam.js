const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Exam = require('../models/Exam');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MERN_EXAM = {
    title: "MERN Stack Mastery - Advanced Certification",
    category: "Full Stack Development",
    duration: 120, // 2 hours
    totalMarks: 100,
    passingMarks: 50,
    negativeMarks: 1,
    status: "published",
    scheduledDate: new Date(),
    questions: [
        // ──────────────── SECTION A: MCQs (React & Frontend) ────────────────
        {
            type: "mcq",
            questionText: "Which of the following is true about React's 'useMemo' hook?",
            marks: 5,
            options: [
                "It is used to cache the result of a function execution between re-renders.",
                "It is used to memoize the function definition itself.",
                "It causes a re-render whenever the dependency array remains the same.",
                "It is a replacement for the 'useEffect' hook for API calls."
            ],
            correctOption: 0
        },
        {
            type: "mcq",
            questionText: "In MongoDB, what is the purpose of an 'Aggregation Pipeline'?",
            marks: 5,
            options: [
                "To speed up simple find() queries using indexes.",
                "To transform and process documents as they pass through multiple stages.",
                "To manage transaction logs for multi-document ACID compliance.",
                "To automatically shard data across multiple physical clusters."
            ],
            correctOption: 1
        },
        {
            type: "mcq",
            questionText: "Which Node.js module is used to handle file paths across different operating systems?",
            marks: 5,
            options: [
                "fs",
                "os",
                "path",
                "url"
            ],
            correctOption: 2
        },

        // ──────────────── SECTION B: WRITTEN CASE (Short Answer) ────────────────
        {
            type: "short",
            questionText: "Explain the concept of 'Hydration' in the context of Next.js or Server-Side Rendering (SSR). What happens if there is a mismatch between server-rendered HTML and client-rendered content?",
            marks: 15,
            maxWords: 250
        },
        {
            type: "short",
            questionText: "Compare the 'State Lifting' pattern vs 'Context API' in React. In what scenarios would you prefer one over the other for managing shared state?",
            marks: 15,
            maxWords: 250
        },

        // ──────────────── SECTION C: CODING CHALLENGE ────────────────
        {
            type: "coding",
            questionText: "Write a function 'findIntersection' that takes two arrays of integers and returns a new array containing only the elements that are present in both arrays. The result should contain unique elements and be sorted in ascending order.",
            marks: 25,
            language: "javascript",
            initialCode: "/**\n * @param {number[]} arr1\n * @param {number[]} arr2\n * @return {number[]}\n */\nfunction findIntersection(arr1, arr2) {\n    // Your code here\n    \n}",
            testCases: [
                { input: "[1, 2, 2, 1], [2, 2]", expectedOutput: "[2]", isHidden: false },
                { input: "[4, 9, 5], [9, 4, 9, 8, 4]", expectedOutput: "[4, 9]", isHidden: false },
                { input: "[1, 2, 3], [4, 5, 6]", expectedOutput: "[]", isHidden: true }
            ]
        },
        {
            type: "coding",
            questionText: "Implement a function 'isAnagram' that checks if two given strings are anagrams of each other. A string is an anagram of another if it contains the same characters with the same frequencies, ignoring spaces and case.",
            marks: 30,
            language: "javascript",
            initialCode: "/**\n * @param {string} s1\n * @param {string} s2\n * @return {boolean}\n */\nfunction isAnagram(s1, s2) {\n    // Your code here\n    \n}",
            testCases: [
                { input: "'listen', 'silent'", expectedOutput: "true", isHidden: false },
                { input: "'hello', 'world'", expectedOutput: "false", isHidden: false },
                { input: "'Dormitory', 'Dirty room'", expectedOutput: "true", isHidden: true }
            ]
        }
    ]
};

async function seedExam() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📡 Connected to MongoDB for seeding...');

        // Find an admin or mentor user to be the creator
        const creator = await User.findOne({ role: { $in: ['admin', 'mentor', 'super_mentor'] } });
        if (!creator) {
            console.error('❌ No Admin/Mentor found. Please run seedTestUsers.js first.');
            process.exit(1);
        }

        MERN_EXAM.creator = creator._id;

        const newExam = new Exam(MERN_EXAM);
        await newExam.save();

        console.log('✅ Exam Created Successfully!');
        console.log(`ID: ${newExam._id}`);
        console.log(`Title: ${newExam.title}`);
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
        process.exit(1);
    }
}

seedExam();
