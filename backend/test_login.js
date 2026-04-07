const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const testLogin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const email = 'vinit';
        const password = '1234';
        
        const user = await User.findOne({ email });
        if (!user) {
            console.error('User not found!');
            process.exit(1);
        }
        
        console.log('User found:', user.email, 'Role:', user.role);
        
        const isMatch = await user.comparePassword(password);
        console.log('Password match:', isMatch);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

testLogin();
