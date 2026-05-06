const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database.');

        // Wipe existing student & mentor accounts
        await User.deleteMany({ role: { $in: ['student', 'mentor', 'admin'] } });
        console.log('🧹 Cleared old accounts.');

        const users = [
            {
                name: 'Vinit',
                email: 'vinit',
                password: '1234',
                role: 'admin',
                permissions: [
                    'create_exam', 'view_live_grid', 'manage_users',
                    'view_reports', 'manage_exams', 'delete_exam', 'system_settings'
                ]
            },
            {
                name: 'Adarsh',
                email: 'adarsh',
                password: '1234',
                role: 'admin',
                permissions: [
                    'create_exam', 'view_live_grid', 'manage_users',
                    'view_reports', 'manage_exams', 'delete_exam', 'system_settings'
                ]
            },
            {
                name: 'Vinit',
                email: 'vinit.mentor',
                password: '1234',
                role: 'mentor'
            },
            {
                name: 'Vinit',
                email: 'vinit.student',
                password: '1234',
                role: 'student'
            }
        ];

        for (const u of users) {
            const user = new User(u);
            await user.save();
            console.log(`✅ Created [${u.role}]  login: ${u.email}  pass: ${u.password}`);
        }

        console.log('\n========================================');
        console.log('  CREDENTIALS SUMMARY');
        console.log('========================================');
        console.log('  Admin    →  vinit         / 1234');
        console.log('  Admin    →  adarsh        / 1234');
        console.log('  Mentor   →  vinit.mentor  / 1234');
        console.log('  Student  →  vinit.student / 1234');
        console.log('========================================');
        process.exit(0);
    } catch (e) {
        console.error('❌ Seeding failed:', e.message);
        process.exit(1);
    }
};

seedUsers();
