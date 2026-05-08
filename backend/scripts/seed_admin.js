const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');

const seedAdmin = async () => {
    try {
        console.log('🚀 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to Database.');

        const email = 'vinit';
        const password = '1234';

        console.log(`🔍 Checking if user "${email}" exists...`);
        let user = await User.findOne({ email });

        if (user) {
            console.log('📝 User found. Updating password and role...');
            user.password = password;
            user.role = 'super_admin';
            user.permissions = ['all'];
            user.status = 'active';
            await user.save();
            console.log('✅ User updated successfully.');
        } else {
            console.log('🆕 User not found. Creating new Super Admin...');
            user = new User({
                name: 'Vinit',
                email,
                password,
                role: 'super_admin',
                permissions: ['all'],
                status: 'active'
            });
            await user.save();
            console.log('✅ New Super Admin created successfully.');
        }

        console.log('\n--- Credentials ---');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log('Role: super_admin');
        console.log('-------------------\n');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB.');
        process.exit(0);
    }
};

seedAdmin();
