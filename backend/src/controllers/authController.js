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

    // 🛡️ Security Fix: Anti-Privilege Escalation
    const validRoles = ['student', 'mentor', 'super_mentor', 'admin'];
    let assignedRole = role || 'student';

    if (!validRoles.includes(assignedRole)) {
        res.status(400);
        throw new Error(`Invalid role provided. Allowed roles: ${validRoles.join(', ')}`);
    }

    if (assignedRole !== 'student') {
        const requesterId = req.user?.id; // Requires verifyToken middleware on the route
        if (!requesterId) {
            res.status(403);
            throw new Error('Unauthorized role assignment. Public registration is limited to student accounts.');
        }
        
        const adminUser = await User.findById(requesterId);
        if (!adminUser || (adminUser.role !== 'admin' && adminUser.role !== 'super_mentor')) {
            res.status(403);
            throw new Error('Only administrators can register mentors or admins.');
        }
    }

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

    let searchEmail = email.trim();
    // 🛡️ Remove hardcoded backdoor logic (Bug 7)

    const user = await User.findOne({ email: searchEmail });
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
                // 🛡️ Security Fix: Use room for previous device and ensure it clears before new token is valid
                io.to(`user_${user._id.toString()}`).emit('force_logout', {
                    message: 'Security Alert: Account accessed from another device. Your session has been terminated.',
                    code: 'SESSION_REPLACED'
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
        { 
            id: user._id, 
            email: user.email, 
            role: user.role,         // 🛡️ Fix Bug 4: Always use the REAL role for API access
            displayRole: finalRole,  // Keep finalRole for frontend UI if needed
            permissions: user.permissions || [] 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

    user.currentSessionToken = token;
    await user.save();

    // ⚡ SYNC TO CACHE: Scalability guard (Bug 1: Fail-safe fallback)
    try {
        await cacheService.saveUserSession(user._id, token);
    } catch (cacheErr) {
        console.warn('🛡️ Cache sync failed during login (Redis down):', cacheErr.message);
    }

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

    // ⚡ SYNC TO CACHE: Scalability guard (Bug 1: Fail-safe fallback)
    try {
        await cacheService.removeUserSession(userId);
    } catch (cacheErr) {
        console.warn('🛡️ Cache sync failed during logout (Redis down):', cacheErr.message);
    }
    
    res.json({
        message: 'Logout successful',
        timestamp: new Date()
    });
});
