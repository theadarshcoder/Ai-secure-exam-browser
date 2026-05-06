const mongoose = require('mongoose');
const User = require('../models/User');
const Exam = require('../models/Exam');
require('dotenv').config();

const seedLoadTestData = async () => {
    try {
        console.log('⏳ Connecting to Database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Database connected.');

        // 1. Create Admin
        await User.deleteMany({ email: 'admin_test@example.com' });
        const admin = new User({
            name: 'Load Test Admin',
            email: 'admin_test@example.com',
            password: 'password123',
            role: 'admin',
            permissions: ['manage_exams', 'view_reports']
        });
        await admin.save();
        console.log('✅ Admin Created');

        // 2. Create 300 Students
        console.log('⏳ Creating 300 test students (with hashing)...');
        await User.deleteMany({ email: /student_.*@example.com/ });
        for (let i = 1; i <= 300; i++) {
            const student = new User({
                name: `Student ${i}`,
                email: `student_${i}@example.com`,
                password: 'password123',
                role: 'student'
            });
            await student.save();
        }
        console.log('✅ 300 Students Created');

        // 3. Create a Test Exam
        await Exam.deleteMany({ title: 'LOAD_TEST_EXAM' });
        const exam = new Exam({
            title: 'LOAD_TEST_EXAM',
            description: 'This is a test exam for load testing.',
            duration: 60,
            totalMarks: 100,
            passingMarks: 33,
            questions: [
                {
                    type: 'mcq',
                    questionText: 'What is Node.js?',
                    options: ['Framework', 'Runtime', 'Language', 'Database'],
                    correctOption: 1,
                    marks: 10
                },
                {
                    type: 'coding',
                    questionText: 'Write a function to add two numbers.',
                    language: 'javascript',
                    marks: 20,
                    testCases: [
                        { input: '1,2', expectedOutput: '3' }
                    ]
                }
            ],
            status: 'published',
            creator: admin._id
        });
        await exam.save();
        console.log('✅ Test Exam Created!');

        // 4. Update Global Settings for Backend Isolation
        const Setting = require('../models/Setting');
        await Setting.findOneAndUpdate({}, {
            enableWebcam: false,
            requireIDVerification: false,
            forceFullscreen: false,
            disableCopyPaste: false
        }, { upsert: true });
        console.log('✅ Global Settings Isolated (Webcam/ID Disabled)');
        console.log('-------------------------------------------');
        console.log('EXAM_ID:', exam._id.toString());
        console.log('STUDENT_PW: password123');
        console.log('-------------------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('❌ SEEDING FAILED:', error.message);
        process.exit(1);
    }
};

seedLoadTestData();
