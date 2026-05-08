const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function updatePassword() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        const User = require('../src/models/User');
        
        const email = 'vinit';
        const newPassword = '1234';
        
        const user = await User.findOne({ email });
        
        if (!user) {
            console.error(`❌ User with email '${email}' not found.`);
            process.exit(1);
        }
        
        user.password = newPassword;
        await user.save();
        
        console.log(`✅ Password for super admin '${email}' updated to '${newPassword}' successfully.`);
    } catch (err) {
        console.error('❌ Error updating password:', err.message);
    } finally {
        process.exit(0);
    }
}

updatePassword();
