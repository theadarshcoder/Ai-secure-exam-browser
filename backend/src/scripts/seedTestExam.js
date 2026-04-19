const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const User = require('../models/User');
require('dotenv').config();

const seedTestExam = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database.');

        // Find the admin user to use as creator
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.error('❌ No admin user found. Run seedTestUsers.js first.');
            process.exit(1);
        }

        // Remove any previously seeded test exams
        await Exam.deleteMany({ title: 'Live Test Exam — Demo' });
        console.log('🧹 Cleared old test exam.');

        // startTime = 30 mins ago so the exam is currently LIVE
        const startTime = new Date(Date.now() - 30 * 60 * 1000);

        const exam = new Exam({
            title: 'Live Test Exam — Demo',
            description: 'A sample live exam for testing the student dashboard.',
            category: 'General',
            duration: 120,           // 2 hours → window: startTime to startTime+120min
            totalMarks: 50,
            passingMarks: 20,
            status: 'published',
            resultsPublished: false,
            scheduledDate: startTime,
            creator: admin._id,
            questions: [
                {
                    type: 'mcq',
                    questionText: 'What does HTML stand for?',
                    marks: 5,
                    options: [
                        'Hyper Text Markup Language',
                        'High Tech Modern Language',
                        'Hyper Transfer Markup Language',
                        'None of the above'
                    ],
                    correctOption: 0
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
                    questionText: 'Which of the following is NOT a React hook?',
                    marks: 5,
                    options: ['useState', 'useEffect', 'useClass', 'useRef'],
                    correctOption: 2
                },
                {
                    type: 'mcq',
                    questionText: 'What is the default HTTP method for a form submission?',
                    marks: 5,
                    options: ['GET', 'POST', 'PUT', 'DELETE'],
                    correctOption: 0
                },
                {
                    type: 'mcq',
                    questionText: 'Which CSS property controls text size?',
                    marks: 5,
                    options: ['font-weight', 'font-size', 'text-style', 'letter-spacing'],
                    correctOption: 1
                }
            ]
        });

        await exam.save();

        console.log('\n========================================');
        console.log('  TEST EXAM SEEDED SUCCESSFULLY');
        console.log('========================================');
        console.log(`  Title     →  ${exam.title}`);
        console.log(`  Status    →  ${exam.status}`);
        console.log(`  StartTime →  ${startTime.toLocaleString()} (30 min ago)`);
        console.log(`  Duration  →  120 min`);
        console.log(`  Questions →  ${exam.questions.length}`);
        console.log('========================================');
        console.log('  Login as: vinit.student / 1234');
        console.log('========================================\n');

        process.exit(0);
    } catch (e) {
        console.error('❌ Seeding failed:', e.message);
        process.exit(1);
    }
};

seedTestExam();
