const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const cacheService = require('../services/cacheService');

// ─── POST /api/auth/register ─────────────────────────────
// Creates a new user (Restricted to Admin)
exports.register = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Name, email, and password are all required!');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        res.status(409);
        throw new Error('An account with this email already exists.');
    }

    const rolePermissions = {
        'student':      [],
        'mentor':       ['create_exam', 'view_live_grid'],
        'super_mentor': ['create_exam', 'view_live_grid', 'manage_users'],
        'admin':        ['create_exam', 'view_live_grid', 'manage_users', 'view_reports']
    };

    // Role resolution: Use the role provided in the request, or default to student
    const assignedRole = role || 'student';

    const user = new User({
        name,
        email,
        password,
        role: assignedRole,
        permissions: rolePermissions[assignedRole] || []
    });

    await user.save();

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
});


// ─── POST /api/auth/login ────────────────────────────────
// User login using email + password
exports.login = asyncHandler(async (req, res) => {
    const { email, password, role: requestedRole, deviceId } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error('Email and password are both required!');
    }

    const user = await User.findOne({ email });
    if (!user) {
        res.status(401);
        throw new Error('Invalid Access Identity or Secure Key!');
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
        res.status(401);
        throw new Error('Invalid Access Identity or Secure Key!');
    }

    // ✨ DEVICE FINGERPRINTING: Anti-Login Sharing
    if (deviceId) {
        if (user.currentDeviceId && user.currentDeviceId !== deviceId) {
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

    // ✨ MASTER FEATURE: Role resolution logic
    // Admin can impersonate any role. Super Mentor logs in via the "Mentor" tab.
    let finalRole = user.role;
    const ROLE_FAMILY = {
        'super_mentor': 'mentor'
    };

    if (user.role === 'admin' && requestedRole) {
        finalRole = requestedRole;
    } else if (requestedRole && user.role !== requestedRole) {
        // Allow login if the user's role belongs to the same family as the requested role
        const family = ROLE_FAMILY[user.role];
        if (!family || family !== requestedRole) {
            res.status(403);
            throw new Error(`Your account is registered as '${user.role}', but you selected '${requestedRole}'!`);
        }
        // Keep the real role (e.g., super_mentor) for permission checks
        finalRole = user.role;
    }

    const token = jwt.sign(
        { id: user._id, email: user.email, role: finalRole },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

    user.currentSessionToken = token;
    await user.save();

    // ⚡ SYNC TO CACHE: Scalability guard
    await cacheService.saveUserSession(user._id, token);

    res.json({
        message: 'Login Successful!',
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: finalRole,
            permissions: user.permissions
        }
    });
});

// ─── POST /api/auth/logout ────────────────────────────────
// User logout - clears currentSessionToken
exports.logout = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    
    // Clear the session token
    user.currentSessionToken = null;
    await user.save();

    // ⚡ SYNC TO CACHE: Scalability guard
    await cacheService.removeUserSession(userId);
    
    res.json({
        message: 'Logout successful',
        timestamp: new Date()
    });
});
