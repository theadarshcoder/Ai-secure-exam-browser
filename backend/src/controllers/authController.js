const User = require('../models/User');
const ExamSession = require('../models/ExamSession');
const jwt = require('jsonwebtoken');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const cacheService = require('../services/cacheService');
const AppError = require('../utils/AppError');

// ─── POST /api/auth/register ─────────────────────────────
// Creates a new user (Restricted to Admin)
exports.register = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        throw new AppError('Name, email, and password are all required!', 400);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new AppError('An account with this email already exists.', 409);
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
        const requesterId = req.user?.id;
        const requesterRole = req.user?.role;

        if (!requesterId) {
            res.status(403);
            throw new Error('Unauthorized role assignment. Public registration is limited to student accounts.');
        }

        // 🛡️ Security Fix: Anti-Privilege Escalation
        // Only Admin can create anyone. Super Mentor can only create students or mentors.
        if (requesterRole === 'super_mentor' && (assignedRole === 'admin' || assignedRole === 'super_mentor')) {
            throw new AppError(`Security Violation: As a 'super_mentor', you are restricted to creating 'student' or 'mentor' accounts only.`, 403);
        }
        
        const adminUser = await User.findById(requesterId);
        if (!adminUser || (adminUser.role !== 'admin' && adminUser.role !== 'super_mentor')) {
            throw new AppError('Only administrators or super mentors can register mentors or admins.', 403);
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
        throw new AppError('Email and password are both required!', 400);
    }

    let searchEmail = email.trim();
    console.log(`🔑 [LOGIN ATTEMPT] Email: ${searchEmail} | Role: ${requestedRole}`);

    const user = await User.findOne({ email: searchEmail }).select('+password');
    if (!user) {
        console.warn(`❌ [LOGIN FAILED] User not found: ${searchEmail}`);
        throw new AppError('Invalid Access Identity or Secure Key!', 401, 'AUTH_FAILED');
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
        console.warn(`❌ [LOGIN FAILED] Incorrect password for: ${searchEmail}`);
        throw new AppError('Invalid Access Identity or Secure Key!', 401, 'AUTH_FAILED');
    }

    console.log(`✅ [LOGIN SUCCESS] User: ${searchEmail} (${user.role})`);

    // ✨ DEVICE FINGERPRINTING: Anti-Login Sharing (Upgraded Fix 5 & 3)
    if (deviceId) {
        // If student is mid-exam, block login unless 'force' is used
        if (user.role === 'student') {
            const activeSession = await ExamSession.findOne({ 
                student: user._id, 
                status: { $in: ['in_progress', 'flagged'] } 
            });

            if (activeSession && user.currentDeviceId && user.currentDeviceId !== deviceId) {
                if (!req.body.force) {
                    return res.status(403).json({
                        code: 'ACTIVE_SESSION_DEVICE_MISMATCH',
                        message: 'Security: You have an active exam session on another device. Resume there or use "Force Login" if that device is inaccessible.'
                    });
                }

                // 🛡️ Fix 3: Force Login Rate Limiting
                const { getRedisClient } = require('../config/redis');
                const redisClient = getRedisClient();
                if (redisClient) {
                    const forceLoginKey = `force_login_count:${user._id}`;
                    const currentCount = await redisClient.get(forceLoginKey);
                    
                    if (currentCount && parseInt(currentCount) >= 3) {
                        return res.status(429).json({
                            code: 'FORCE_LOGIN_LIMIT_EXCEEDED',
                            message: 'Security Alert: Too many "Force Login" attempts. Your account has been temporarily restricted. Please contact support.'
                        });
                    }
                    
                    await redisClient.incr(forceLoginKey);
                    await redisClient.expire(forceLoginKey, 600); // 10 min window
                }

                console.warn(`[SECURITY] Force Login by ${user.email} during active exam ${activeSession.exam}`);
            }
        }

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

    // 🛡️ Phase 2/3 Fix: Use dedicated Refresh Secret & Include sessionVersion
    user.sessionVersion = (user.sessionVersion || 0) + 1;
    user.currentDeviceId = deviceId;
    
    const refreshToken = jwt.sign(
        { id: user._id, sessionVersion: user.sessionVersion },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );

    user.refreshToken = refreshToken;
    await user.save();

    // 🛡️ Optimized JWT Payload: Standardized Access Token
    const accessToken = jwt.sign(
        { 
            id: user._id, 
            email: user.email, 
            role: user.role,         
            displayRole: finalRole,
            sessionVersion: user.sessionVersion 
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' } 
    );

    // ⚡ SYNC TO CACHE: Redis stores sessionVersion (not token) for lightweight validation
    try {
        await cacheService.saveUserSession(user._id, user.sessionVersion, user.permissions);
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
    
    // 🛡️ Phase 2 Fix: Atomic Session Invalidation
    await User.findByIdAndUpdate(userId, { 
        $set: { refreshToken: null },
        $inc: { sessionVersion: 1 }
    });

    try {
        await cacheService.removeUserSession(userId);
    } catch (cacheErr) {
        console.warn('🛡️ Cache sync failed during logout (Redis down):', cacheErr.message);
    }
    
    res.json({ message: 'Logout successful' });
});

// ─── POST /api/auth/refresh ───────────────────────────────
exports.refresh = asyncHandler(async (req, res) => {
    const { refreshToken: incomingToken } = req.body;

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError('No token provided. Session might be expired.', 401, 'AUTH_MISSING');
    }

    try {
        // 1. Verify token structure & secret
        const decoded = jwt.verify(incomingToken, process.env.JWT_REFRESH_SECRET);
        
        // 2. Atomic check: find user where this SPECIFIC token is valid
        const user = await User.findOne({ _id: decoded.id, refreshToken: incomingToken });

        if (!user) {
            // 🚨 POSSIBLE TOKEN THEFT DETECTED
            // If we found the user by ID but the token doesn't match, someone used an old token.
            const compromisedUser = await User.findById(decoded.id);
            if (compromisedUser) {
                console.error(`⚠️ [SECURITY] Token reuse detected for user: ${decoded.id}. Invalidating all sessions.`);
                compromisedUser.refreshToken = null;
                compromisedUser.sessionVersion = (compromisedUser.sessionVersion || 0) + 1;
                await compromisedUser.save();
            }
            throw new AppError('Security Alert: Session compromised or token reused. Please login again.', 403);
        }

        // 3. Version Check: Ensure token version matches DB version
        if (decoded.sessionVersion !== user.sessionVersion) {
            throw new AppError('Invalid refresh token. Please login again.', 403, 'REFRESH_INVALID');
        }

        // 4. 🔥 ROTATE: Generate NEW Access + NEW Refresh Token
        const newRefreshToken = jwt.sign(
            { id: user._id, sessionVersion: user.sessionVersion },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        const newAccessToken = jwt.sign(
            { 
                id: user._id, 
                email: user.email, 
                role: user.role,
                displayRole: user.role,
                sessionVersion: user.sessionVersion
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // 5. Save rotated token
        user.refreshToken = newRefreshToken;
        await user.save();

        // 6. Sync new session version to cache
        await cacheService.saveUserSession(user._id, user.sessionVersion, user.permissions);

        console.log(`🔁 [Auth] Token rotated successfully for user: ${user.email}`);

        res.json({ 
            accessToken: newAccessToken, 
            refreshToken: newRefreshToken 
        });

    } catch (error) {
        console.warn(`🚫 [Auth] Refresh failed: ${error.message}`);
        throw new AppError(error.message || 'Refresh Token validation failed', 403);
    }
});
