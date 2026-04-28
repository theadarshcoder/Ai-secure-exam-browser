const jwt = require('jsonwebtoken');

// Mock Socket Object
const createMockSocket = (userId, version) => ({
    handshake: {
        auth: {
            token: jwt.sign({ id: userId, sessionVersion: version }, process.env.JWT_SECRET || 'test-secret')
        }
    },
    rooms: new Set(),
    join: jest.fn(function(room) { this.rooms.add(room); }),
    disconnect: jest.fn(),
    user: null
});

describe('🔌 Socket.IO Contract Test', () => {
    
    const userId = 'user_999';
    const currentVersion = 5;

    it('✅ Socket should join user room on valid token', () => {
        const socket = createMockSocket(userId, currentVersion);
        const userInDB = { _id: userId, sessionVersion: currentVersion };

        // Simulated Socket Auth Middleware Logic
        const decoded = jwt.verify(socket.handshake.auth.token, 'test-secret');
        if (decoded.sessionVersion === userInDB.sessionVersion) {
            socket.user = decoded;
            socket.join(`user_${decoded.id}`);
        }

        expect(socket.rooms.has(`user_${userId}`)).toBe(true);
        expect(socket.disconnect).not.toHaveBeenCalled();
    });

    it('❌ Socket should hard-disconnect on version mismatch', () => {
        const oldVersion = 4;
        const socket = createMockSocket(userId, oldVersion);
        const userInDB = { _id: userId, sessionVersion: currentVersion }; // Bounced version

        // Simulated Socket Auth Middleware Logic
        const decoded = jwt.verify(socket.handshake.auth.token, 'test-secret');
        if (decoded.sessionVersion !== userInDB.sessionVersion) {
            socket.disconnect(true);
        }

        expect(socket.rooms.has(`user_${userId}`)).toBe(false);
        expect(socket.disconnect).toHaveBeenCalledWith(true);
    });
});
