const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');

const seedSuperAdmins = async () => {
    try {
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        const usersToSeed = [
            { email: 'vinit', name: 'Vinit' },
            { email: 'adarsh', name: 'Adarsh' }
        ];

        for (const userData of usersToSeed) {
            let user = await User.findOne({ email: userData.email });

            if (!user) {
                console.log(`🆕 Creating Super Admin: ${userData.email}`);
                user = new User({
                    name: userData.name,
                    email: userData.email,
                    password: '1234',
                    role: 'super_admin',
                    status: 'active',
                    permissions: ['all']
                });
                await user.save();
                console.log(`✅ Created: ${userData.email}`);
            } else {
                console.log(`🔄 Updating User to Super Admin: ${userData.email}`);
                user.password = '1234';
                user.role = 'super_admin';
                user.status = 'active';
                user.permissions = ['all'];
                // Ensure institutionId is null for platform owners
                user.institutionId = null;
                await user.save();
                console.log(`✅ Updated: ${userData.email}`);
            }
        }

        console.log('\n🚀 ALL SUPER ADMINS SEEDED SUCCESSFULLY!');
        console.log('Credentials: 1234 for both vinit and adarsh');

    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

seedSuperAdmins();
