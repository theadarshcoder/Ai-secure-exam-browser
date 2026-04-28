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
    console.log(`🔑 [LOGIN ATTEMPT] Email: ${searchEmail} | Role: ${requestedRole}`);

    const user = await User.findOne({ email: searchEmail });
    if (!user) {
        console.warn(`❌ [LOGIN FAILED] User not found: ${searchEmail}`);
        res.status(401);
        throw new Error('Invalid Access Identity or Secure Key!');
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
        console.warn(`❌ [LOGIN FAILED] Incorrect password for: ${searchEmail}`);
        res.status(401);
        throw new Error('Invalid Access Identity or Secure Key!');
    }

    console.log(`✅ [LOGIN SUCCESS] User: ${searchEmail} (${user.role})`);

    // ✨ DEVICE FINGERPRINTING: Anti-Login Sharing
    if (deviceId) {
        if (user.currentDeviceId && user.currentDeviceId !== deviceId) {
            const io = req.app.get('io');
            if (io) {
                console.log(`🔒 Anti-Cheating: Disconnecting previous session for ${user.email} (New device detected)`);
                io.to(`user_${user._id.toString()}`).emit('force_logout', {
                    message: 'Security Alert: Account accessed from another device. Your session has been terminated.',
                    code: 'SESSION_REPLACED'
                });
            }
        }
        user.currentDeviceId = deviceId;
    }

    // ✨ MASTER FEATURE: Role resolution logic
    let finalRole = user.role;
    const ROLE_FAMILY = {
        'super_mentor': 'mentor'
    };

    if (user.role === 'admin' && requestedRole) {
        finalRole = requestedRole;
    } else if (requestedRole && user.role !== requestedRole) {
        const family = ROLE_FAMILY[user.role];
        if (!family || family !== requestedRole) {
            res.status(403);
            throw new Error(`Your account is registered as '${user.role}', but you selected '${requestedRole}'!`);
        }
        finalRole = user.role;
    }

    // 🛡️ Optimized JWT Payload: Permissions removed to save header space
    const accessToken = jwt.sign(
        { 
            id: user._id, 
            email: user.email, 
            role: user.role,         
            displayRole: finalRole 
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' } 
    );

    const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: '7d' } 
    );

    user.refreshToken = refreshToken;
    await user.save();

    // ⚡ SYNC TO CACHE: Redis handles active session tracking & permissions
    try {
        await cacheService.saveUserSession(user._id, accessToken, user.permissions);
    } catch (cacheErr) {
        console.warn('🛡️ Cache sync failed during login (Redis down):', cacheErr.message);
    }

    res.json({
        message: 'Login Successful!',
        accessToken,
        refreshToken,
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
exports.logout = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (user) {
        user.refreshToken = null;
        await user.save();
    }

    try {
        await cacheService.removeUserSession(userId);
    } catch (cacheErr) {
        console.warn('🛡️ Cache sync failed during logout (Redis down):', cacheErr.message);
    }
    
    res.json({ message: 'Logout successful' });
});

// ─── POST /api/auth/refresh ───────────────────────────────
exports.refresh = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        res.status(401);
        throw new Error('Refresh Token is required!');
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== refreshToken) {
            res.status(403);
            throw new Error('Invalid or expired Refresh Token');
        }

        // Generate new Access Token (Optimized payload)
        const accessToken = jwt.sign(
            { 
                id: user._id, 
                email: user.email, 
                role: user.role,
                displayRole: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        // Sync new token to Redis with permissions
        await cacheService.saveUserSession(user._id, accessToken, user.permissions);

        res.json({ accessToken });
    } catch (error) {
        res.status(403);
        throw new Error('Refresh Token validation failed');
    }
});
