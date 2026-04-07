const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const seedAdmin = async () => {
    try {
        console.log('⏳ Connecting to Database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Database connected.');

        // Step 2: Delete ALL existing admins (Cleaning up the junk)
        console.log('🧹 Cleaning old/junk admin accounts...');
        await User.deleteMany({ role: 'admin' });
        console.log('🗑️  All old admin accounts deleted!');

        // Step 3: Create the requested Master Admin
        const adminUser = new User({
            name: 'Vinit',
            email: 'vinit',      // Login ID
            password: '1234',    // Plain text, auto-hashed by model
            role: 'admin',
            permissions: [
                'create_exam', 
                'view_live_grid', 
                'manage_users', 
                'view_reports', 
                'manage_exams', 
                'delete_exam',
                'system_settings'
            ]
        });

        await adminUser.save();

        console.log('🎉 INITIAL MASTER ADMIN CREATED SUCCESSFULLY!');
        console.log('-------------------------------------------');
        console.log('Name:     Vinit');
        console.log('Email/ID: vinit');
        console.log('Password: 1234');
        console.log('Role:     ADMIN');
        console.log('-------------------------------------------');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ SEEDING FAILED:', error.message);
        process.exit(1);
    }
};

seedAdmin();
