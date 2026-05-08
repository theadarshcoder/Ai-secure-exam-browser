const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');

const checkAdarsh = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email: 'adarsh' });
        if (user) {
            console.log('Adarsh found:', JSON.stringify(user, null, 2));
        } else {
            console.log('Adarsh not found in the database.');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

checkAdarsh();
