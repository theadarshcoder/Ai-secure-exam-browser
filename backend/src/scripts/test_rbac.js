const { checkPermission } = require('../middlewares/authMiddleware');

const mockUser = {
    id: '123',
    role: 'mentor',
    permissions: ['create_exam']
};

const makeMockReq = (user) => ({
    user: { id: user.id },
});

const mockRes = {
    status: function(code) {
        this.statusCode = code;
        return this;
    },
    json: function(data) {
        this.responseData = data;
        return this;
    }
};

const mockNext = () => {
    console.log('Permission Granted!');
};

const User = require('../models/User');
const originalFindById = User.findById;

async function test() {
    console.log('--- Testing RBAC Middleware ---');

    console.log('Test 1: Mentor with "create_exam" permission access "/create"');
    User.findById = () => Promise.resolve(mockUser);
    const middleware1 = checkPermission('create_exam');
    await middleware1(makeMockReq(mockUser), mockRes, mockNext);

        // Case 2: Mentor without permission
    console.log('\nTest 2: Mentor without "view_live_grid" permission access "/live-grid"');
    const middleware2 = checkPermission('view_live_grid');
    await middleware2(makeMockReq(mockUser), mockRes, () => console.log('FAIL: Should not grant permission'));
    if (mockRes.statusCode === 403) {
        console.log('Permission Denied as expected:', mockRes.responseData.message);
    }

    // Case 3: Admin access
    console.log('\nTest 3: Admin access "/live-grid"');
    const adminUser = { id: 'admin1', role: 'admin', permissions: [] };
    User.findById = () => Promise.resolve(adminUser);
    const middleware3 = checkPermission('view_live_grid');
    await middleware3(makeMockReq(adminUser), mockRes, () => console.log('Permission Granted to Admin!'));

    // Restore original User.findById
    User.findById = originalFindById;
}

test().catch(err => console.error(err));
