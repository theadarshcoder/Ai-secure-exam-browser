const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

// ─── Password Hashing ───────────────────────────────────
// Jab bhi koi naya user banega ya password change hoga,
// ye middleware automatically password ko hash kar dega
// Taaki database mein kabhi bhi plain text password save na ho

userSchema.pre('save', async function (next) {
    // Agar password change nahi hua toh skip karo (jaise name update karte waqt)
    if (!this.isModified('password')) return next();

    // Password ko hash karo (10 rounds of salt = strong security)
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// ─── Password Compare Helper ────────────────────────────
// Login ke time use hoga — user ka diya password vs database ka hashed password
// Returns: true (match) ya false (galat password)

userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
