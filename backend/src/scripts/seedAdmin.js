const mongoose = require('mongoose');
const User = require('../models/User');
const Institution = require('../models/Institution');
require('dotenv').config();

const seedAdmin = async () => {
    try {
        console.log('Connecting to Database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Database connected.');

        // Ensure DEFAULT institution exists
        let defaultInst = await Institution.findOne({ code: 'DEFAULT' });
        if (!defaultInst) {
            console.log('Creating fallback DEFAULT institution...');
            defaultInst = new Institution({
                name: 'Default Platform Institution',
                code: 'DEFAULT',
                domain: 'default.local',
                status: 'active'
            });
            await defaultInst.save();
        }

        console.log('Cleaning old admin accounts...');
        await User.deleteMany({ role: 'admin' });
        console.log('All old admin accounts deleted!');

        // Step 3: Create the requested Master Admins
        const admins = [
            {
                name: 'Adarsh',
                email: 'adarsh',      // Login ID
                password: '1234',    // Plain text, auto-hashed by model
                role: 'admin',
                institutionId: defaultInst._id,
                permissions: [
                    'create_exam', 
                    'view_live_grid', 
                    'manage_users', 
                    'view_reports', 
                    'manage_exams', 
                    'delete_exam',
                    'system_settings'
                ]
            }
        ];

        for (const adminData of admins) {
            const adminUser = new User(adminData);
            await adminUser.save();
            console.log(`ADMIN ${adminData.name} CREATED SUCCESSFULLY!`);
        }

        console.log('-------------------------------------------');
        console.log('Admin Users Restored!');
        console.log('Passwords: 1234');
        console.log('-------------------------------------------');
        
        process.exit(0);
    } catch (error) {
        console.error('SEEDING FAILED:', error.message);
        process.exit(1);
    }
};

seedAdmin();
