// ─────────────────────────────────────────────────────────
// authController.js — Handles Registration & Login
// ─────────────────────────────────────────────────────────

const User = require('../models/User');
const jwt = require('jsonwebtoken');

// ─── POST /api/auth/register ─────────────────────────────
// Creates a new user (Restricted to Admin)
// Body requirements: { name, email, password, role }
// Password is automatically hashed by User model's pre-save hook

exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Step 1: Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ 
                error: 'Name, email, and password are all required!' 
            });
        }

        // Step 2: Check for existing account with this email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ 
                error: 'An account with this email already exists.' 
            });
        }

        // Step 3: Set default permissions based on role
        const rolePermissions = {
            'mentor':     ['create_exam', 'view_live_grid'],
            'admin':      ['create_exam', 'view_live_grid', 'manage_users', 'view_reports'],
            'exam_admin': ['create_exam', 'manage_exams'],
            'student':    []
        };

        // Step 4: Create new user
        // NOTE: Password provided here is plain text, but User.js 
        // pre-save hook hashes it automatically before saving!
        const user = new User({
            name,
            email,
            password,                                    // <-- hashed in DB
            role: role || 'student',                     // default role = student
            permissions: rolePermissions[role] || []     // role-based permissions
        });

        await user.save();

        // Step 5: Success response (omit password for security)
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
// User login using email + password
// Returns a JWT token (valid for 1 hour) on success

exports.login = async (req, res) => {
    try {
        const { email, password, role: requestedRole, deviceId } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are both required!' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid Access Identity or Secure Key!' });
        }

        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ error: 'Invalid Access Identity or Secure Key!' });
        }

        // ✨ DEVICE FINGERPRINTING: Anti-Login Sharing
        if (deviceId) {
            if (user.currentDeviceId && user.currentDeviceId !== deviceId) {
                // Secondary login detected on a different device!
                // Emit force_logout to the older connected socket session
                const io = req.app.get('io');
                if (io) {
                    console.log(`🔒 Anti-Cheating: Disconnecting previous session for ${user.email} (New device detected)`);
                    io.to(`user_${user._id}`).emit('force_logout', {
                        message: 'Security Alert: Account accessed from another device. Your session has been terminated.'
                    });
                }
            }
            user.currentDeviceId = deviceId;
        }

        // ✨ MASTER FEATURE: Admin can impersonate any role!
        // If the DB user is an Admin, they can switch to the role 
        // selected in the Frontend UI (Student/Mentor) for testing purposes.
        let finalRole = user.role;
        if (user.role === 'admin' && requestedRole) {
            finalRole = requestedRole;
        } else if (requestedRole && user.role !== requestedRole) {
            // Block unauthorized role switching (e.g., student trying to be a mentor)
            return res.status(403).json({ 
                error: `Your account is registered as '${user.role}', but you selected '${requestedRole}'!` 
            });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: finalRole },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
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
