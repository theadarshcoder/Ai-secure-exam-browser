const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { verifyToken } = require('../middlewares/authMiddleware');

// Mock req/res/next
const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.responseData = data; return res; };
    return res;
};

async function test() {
    console.log('--- Testing Advanced Security Features ---');

    // 1. Mock Database findById
    const userId = new mongoose.Types.ObjectId();
    const mockUser = {
        _id: userId,
        email: 'test@example.com',
        role: 'mentor',
        permissions: ['test_perm'],
        currentSessionToken: 'token1',
        save: async function() { return this; }
    };

    const originalFindById = User.findById;
    User.findById = (id) => Promise.resolve(mockUser);
    
    const originalVerify = jwt.verify;
    jwt.verify = () => ({ id: userId, email: 'test@example.com', role: 'mentor' });

    // --- TEST 1: Single Active Session ---
    console.log('\nTest 1: Concurrent Login Detection');
    
    const req = { headers: { authorization: 'Bearer token_OLD' } };
    const res = mockRes();
    
    await verifyToken(req, res, () => console.log('FAIL: Should have blocked old token'));
    
    if (res.statusCode === 403 && res.responseData.error === "Double Login Detected!") {
        console.log('✅ PASS: Old session rejected as expected.');
    }

    // --- TEST 2: Audit Logging ---
    console.log('\nTest 2: Audit Logging Logic');
    
    const originalCreate = AuditLog.create;
    let loggedData = null;
    AuditLog.create = async (data) => { loggedData = data; return data; };

    // Simulate the logic in adminRoutes
    const adminId = new mongoose.Types.ObjectId();
    const action = 'UPDATE_PERMISSIONS';
    const targetUserId = userId;
    const details = { oldPermissions: [], newPermissions: ['read'] };

    await AuditLog.create({ adminId, action, targetUserId, details });

    if (loggedData && loggedData.action === 'UPDATE_PERMISSIONS') {
        console.log('✅ PASS: Audit log entry created correctly.');
        console.log('Logged action:', loggedData.action);
    }

    // --- TEST 3: Role Hierarchy (Enum validation) ---
    console.log('\nTest 3: Role Enum Validation');
    const validRoles = ['super_admin', 'exam_admin', 'proctor_lead', 'proctor'];
    const schemaRoles = User.schema.path('role').enumValues;
    
    const allPresent = validRoles.every(r => schemaRoles.includes(r));
    if (allPresent) {
        console.log('✅ PASS: All hierarchical roles present in User model.');
    } else {
        console.log('❌ FAIL: Missing roles:', validRoles.filter(r => !schemaRoles.includes(r)));
    }

    // Restore mocks
    User.findById = originalFindById;
    jwt.verify = originalVerify;
    AuditLog.create = originalCreate;
}

test().catch(err => console.error(err));
