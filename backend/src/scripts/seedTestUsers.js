const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        await User.deleteMany({ role: { $in: ['student', 'mentor'] } });

        const student = new User({ name: 'Student 1', email: 'student1', password: 'password', role: 'student' });
        await student.save();

        const mentor = new User({ name: 'Mentor 1', email: 'mentor1', password: 'password', role: 'mentor' });
        await mentor.save();

        console.log('Student & Mentor seeded successfully.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seedUsers();
