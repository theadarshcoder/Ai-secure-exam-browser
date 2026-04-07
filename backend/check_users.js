const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({}, 'name email role');
        console.log('--- Current Users in DB ---');
        console.table(users.map(u => ({ name: u.name, email: u.email, role: u.role })));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkUsers();
