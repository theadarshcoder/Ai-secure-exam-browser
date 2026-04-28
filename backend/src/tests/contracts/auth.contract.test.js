require('../jest.setup.js');
const request = require('supertest');
const { z } = require('zod');
const db = require('../utils/setupTestDB');
const app = require('../../server');
const User = require('../../models/User');

// --- SCHEMAS ---
const AuthResponseSchema = z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    user: z.object({
        id: z.string(),
        email: z.string().email(),
        role: z.string()
    })
});

const RefreshResponseSchema = z.object({
    accessToken: z.string(),
    refreshToken: z.string()
});

beforeAll(async () => await db.connect());
afterAll(async () => await db.close());
afterEach(async () => await db.clear());

describe('🔐 Auth Contract & Integrity Tests', () => {
    
    const testUser = {
        name: 'Test Student',
        email: 'student@vision.com',
        password: 'Password123!',
        role: 'student'
    };

    it('✅ Login should return unified contract shape', async () => {
        // Setup user
        await request(app).post('/api/auth/register').send(testUser);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: testUser.password });

        expect(res.status).toBe(200);
        // Schema Enforcement
        AuthResponseSchema.parse(res.body);
    });

    it('🔁 Refresh should rotate tokens and return contract shape', async () => {
        await request(app).post('/api/auth/register').send(testUser);
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: testUser.password });

        const oldRefreshToken = loginRes.body.refreshToken;

        // Refresh call
        const refreshRes = await request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken: oldRefreshToken });

        expect(refreshRes.status).toBe(200);
        RefreshResponseSchema.parse(refreshRes.body);
        
        // Verify Rotation
        expect(refreshRes.body.refreshToken).not.toBe(oldRefreshToken);
    });

    it('🛡️ Token Reuse (Theft Detection) should kill all sessions', async () => {
        await request(app).post('/api/auth/register').send(testUser);
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: testUser.password });

        const refreshToken1 = loginRes.body.refreshToken;

        // Use token once (Rotation happens)
        const refresh1 = await request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken: refreshToken1 });

        // Use OLD token again (Theft detection)
        const refresh2 = await request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken: refreshToken1 });

        expect(refresh2.status).toBe(403);
        expect(refresh2.body.message).toContain('Session compromised');

        // Verify user in DB has no refresh token and bumped version
        const user = await User.findOne({ email: testUser.email });
        expect(user.refreshToken).toBeNull();
        expect(user.sessionVersion).toBeGreaterThan(loginRes.body.user.sessionVersion || 0);
    });
});
