const mongoose = require('mongoose');
const User = require('../models/User');
const Institution = require('../models/Institution');
const Exam = require('../models/Exam');
const ExamSession = require('../models/ExamSession');
const AuditLog = require('../models/AuditLog');
const ErrorLog = require('../models/ErrorLog');
const ExamInvite = require('../models/ExamInvite');
const InstitutionSettings = require('../models/InstitutionSettings');
require('dotenv').config();
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') }); // fallback

const seedSuperAdmin = async () => {
    try {
        console.log('Connecting to Database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Database connected.');

        // Step 1: Create DEFAULT_INSTITUTION
        console.log('Creating DEFAULT_INSTITUTION...');
        let defaultInst = await Institution.findOne({ code: 'DEFAULT' });
        if (!defaultInst) {
            defaultInst = new Institution({
                name: 'Default Platform Institution',
                code: 'DEFAULT',
                domain: 'default.local',
                plan: 'pro',
                status: 'active'
            });
            await defaultInst.save();
            console.log('DEFAULT_INSTITUTION created.');
        } else {
            console.log('DEFAULT_INSTITUTION already exists.');
        }

        // Step 2: Create Default Institution Settings
        let defaultSettings = await InstitutionSettings.findOne({ institutionId: defaultInst._id });
        if (!defaultSettings) {
            defaultSettings = new InstitutionSettings({
                institutionId: defaultInst._id
            });
            await defaultSettings.save();
            console.log('✅ Default Institution Settings created.');
        }

        console.log('Creating SUPER_ADMIN accounts...');
        await User.deleteMany({ role: 'super_admin' });
        await User.deleteOne({ email: 'vinit' });
        
        const superAdmins = [
            {
                name: 'Platform Owner',
                email: 'superadmin', // Login ID
                password: 'admin',   // Plain text, auto-hashed by model
                role: 'super_admin',
                institutionId: null, // super_admin has global access
                permissions: ['all']
            },
            {
                name: 'Vinit',
                email: 'vinit',      // Login ID
                password: '1234',    // Plain text, auto-hashed by model
                role: 'super_admin',
                institutionId: null, // super_admin has global access
                permissions: ['all']
            }
        ];

        for (const adminData of superAdmins) {
            const admin = new User(adminData);
            await admin.save();
            console.log(`SUPER_ADMIN account created: ${adminData.email}`);
        }

        // Step 4: Migrate existing data to DEFAULT_INSTITUTION
        console.log('Migrating existing data to DEFAULT_INSTITUTION...');
        const migrationPromises = [
            User.updateMany({ institutionId: null, role: { $ne: 'super_admin' } }, { institutionId: defaultInst._id }),
            Exam.updateMany({ institutionId: null }, { institutionId: defaultInst._id }),
            ExamSession.updateMany({ institutionId: null }, { institutionId: defaultInst._id }),
            AuditLog.updateMany({ institutionId: null }, { institutionId: defaultInst._id }),
            ErrorLog.updateMany({ institutionId: null }, { institutionId: defaultInst._id }),
            ExamInvite.updateMany({ institutionId: null }, { institutionId: defaultInst._id })
        ];

        const results = await Promise.all(migrationPromises);
        console.log(`Migration complete:`);
        console.log(`  - Users modified: ${results[0].modifiedCount}`);
        console.log(`  - Exams modified: ${results[1].modifiedCount}`);
        console.log(`  - Sessions modified: ${results[2].modifiedCount}`);
        console.log(`  - AuditLogs modified: ${results[3].modifiedCount}`);
        console.log(`  - ErrorLogs modified: ${results[4].modifiedCount}`);
        console.log(`  - ExamInvites modified: ${results[5].modifiedCount}`);
        console.log('-------------------------------------------');
        console.log('SaaS Transformation Seed & Migration Successful!');
        console.log('-------------------------------------------');
        
        process.exit(0);
    } catch (error) {
        console.error('SEEDING FAILED:', error.message);
        process.exit(1);
    }
};

seedSuperAdmin();
