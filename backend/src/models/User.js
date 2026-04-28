const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['student', 'mentor', 'super_mentor', 'admin'],
        default: 'student' 
    },
    refreshToken: { type: String },
    currentDeviceId: { type: String },
    permissions: [{ type: String }],
    // Identity Verification (eKYC)
    profilePicture: { type: String, default: null },
    idCardUrl: { type: String, default: null },
    isVerified: { type: Boolean, default: false }
}, { timestamps: true });

// ─── Password Hashing ───────────────────────────────────
// This middleware automatically hashes the password whenever 
// a new user is created or the password is changed.
// Ensuring that plain-text passwords are never stored in the database.

userSchema.pre('save', async function () {
    // Skip if the password has not been modified (e.g., updating only the name)
    if (!this.isModified('password')) return;

    // Hash the password with 10 rounds of salt for strong security
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// 🛡️ Security Fix: Handle updates via findOneAndUpdate/findByIdAndUpdate
userSchema.pre('findOneAndUpdate', async function() {
    const update = this.getUpdate();
    if (update.password) {
        const salt = await bcrypt.genSalt(10);
        update.password = await bcrypt.hash(update.password, salt);
    }
});

// ─── Password Compare Helper ────────────────────────────
// Used during login to compare the provided password against 
// the hashed password stored in the database.
// Returns: true (match) or false (incorrect password)

userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
