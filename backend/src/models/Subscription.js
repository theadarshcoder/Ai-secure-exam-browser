const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
    },
    message: {
        type: String,
        trim: true,
        maxlength: [1000, 'Message cannot be more than 1000 characters']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
