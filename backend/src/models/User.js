const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['student', 'mentor', 'admin', 'super_admin', 'exam_admin', 'proctor_lead', 'proctor'],
        default: 'student' 
    },
    currentSessionToken: { type: String },
    permissions: [{ type: String }]
}, { timestamps: true });


module.exports = mongoose.model('User', userSchema);
