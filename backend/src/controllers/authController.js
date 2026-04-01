// ─────────────────────────────────────────────────────────
// authController.js — Handles Registration & Login
// ─────────────────────────────────────────────────────────

const User = require('../models/User');
const jwt = require('jsonwebtoken');

// ─── POST /api/auth/register ─────────────────────────────
// Naya user create karta hai (Admin hi kar sakta hai)
// Body mein chahiye: { name, email, password, role }
// Password automatically hash ho jayega (User model ka pre-save hook)

exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Step 1: Check karo ki saare required fields aaye hain
        if (!name || !email || !password) {
            return res.status(400).json({ 
                error: 'Name, email aur password — teeno required hain!' 
            });
        }

        // Step 2: Check karo ki is email se pehle se koi registered toh nahi
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ 
                error: 'Is email se pehle se ek account exist karta hai.' 
            });
        }

        // Step 3: Role ke hisaab se default permissions set karo
        const rolePermissions = {
            'mentor':     ['create_exam', 'view_live_grid'],
            'admin':      ['create_exam', 'view_live_grid', 'manage_users', 'view_reports'],
            'exam_admin': ['create_exam', 'manage_exams'],
            'student':    []
        };

        // Step 4: Naya user create karo
        // NOTE: Password yahan plain text lag raha hai, lekin User.js ka
        // pre-save hook isko automatically hash kar dega before saving!
        const user = new User({
            name,
            email,
            password,                                    // <-- ye hash hoke jayega DB mein
            role: role || 'student',                     // default role = student
            permissions: rolePermissions[role] || []     // role ke hisaab se permissions
        });

        await user.save();

        // Step 5: Success response (password wapas nahi bhejte — security!)
        res.status(201).json({
            message: 'User registered successfully!',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                permissions: user.permissions
            }
        });

    } catch (error) {
        console.error('Registration failed:', error);
        res.status(500).json({ error: 'Registration failed', details: error.message });
    }
};


// ─── POST /api/auth/login ────────────────────────────────
// User login karta hai email + password se
// Sahi hone par JWT token milta hai (1 hour valid)

exports.login = async (req, res) => {
    try {
        const { email, password, role: requestedRole } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email aur password dono required hain!' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Galat email ya password!' });
        }

        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ error: 'Galat email ya password!' });
        }

        // ✨ MASTER FEATURE: Admin can impersonate any role!
        // Agar DB mein user Admin hai, toh Frontend UI mein jo Role select kiya gaya hai (Student/Mentor)
        // Admin uss role mein switch ho jayega testing ke liye!
        let finalRole = user.role;
        if (user.role === 'admin' && requestedRole) {
            finalRole = requestedRole;
        } else if (requestedRole && user.role !== requestedRole) {
            // Agar normal student try kare mentor banne ki, toh block kardo!
            return res.status(403).json({ 
                error: `Aapka account '${user.role}' ka hai, par aapne '${requestedRole}' select kiya hai!` 
            });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: finalRole },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        user.currentSessionToken = token;
        await user.save();

        res.json({
            message: 'Login Successful!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: finalRole, // Issue the impersonated role!
                permissions: user.permissions
            }
        });

    } catch (error) {
        console.error('Login failed:', error);
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
};
