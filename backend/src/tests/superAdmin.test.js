const request = require('supertest');
const mongoose = require('mongoose');
const { getRedisClient } = require('../config/redis');
const app = require('../server'); // Assuming server.js exports app

/**
 * 🧪 Super Admin Backend Integration Tests
 * Focuses on Platform Governance, Monitoring, and Security.
 */

describe('🚀 Super Admin Operational API Tests', () => {
    let token;
    let server;

    beforeAll(async () => {
        // Use a test DB if possible, but here we'll assume the environment is set up
        // Login as the seeded super admin to get a valid token
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'superadmin',
                password: 'admin',
                role: 'super_admin'
            });
        
        token = res.body.accessToken;
    });

    afterAll(async () => {
        const redis = getRedisClient();
        if (redis) await redis.quit();
        await mongoose.connection.close();
    });

    describe('📈 Platform Intelligence', () => {
        it('should fetch platform-wide statistics', async () => {
            const res = await request(app)
                .get('/api/super-admin/stats')
                .set('Authorization', `Bearer ${token}`);
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('counts');
            expect(res.body.counts).toHaveProperty('institutions');
            expect(res.body.counts).toHaveProperty('exams');
        });

        it('should fetch global audit logs', async () => {
            const res = await request(app)
                .get('/api/super-admin/audit-logs')
                .set('Authorization', `Bearer ${token}`);
            
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.logs)).toBe(true);
        });
    });

    describe('🩺 Infrastructure Observability', () => {
        it('should return system health metrics', async () => {
            const res = await request(app)
                .get('/api/super-admin/health')
                .set('Authorization', `Bearer ${token}`);
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('database');
            expect(res.body).toHaveProperty('cache');
            expect(res.body.database.status).toBe('up');
        });

        it('should fetch background queue statistics', async () => {
            const res = await request(app)
                .get('/api/super-admin/queues')
                .set('Authorization', `Bearer ${token}`);
            
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe('🛡️ Platform Governance', () => {
        it('should update platform operational mode', async () => {
            const res = await request(app)
                .patch('/api/super-admin/settings/mode')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    mode: 'maintenance',
                    reason: 'API Integration Testing'
                });
            
            expect(res.status).toBe(200);
            expect(res.body.settings.platformMode).toBe('maintenance');
            
            // Revert to active for other tests
            await request(app)
                .patch('/api/super-admin/settings/mode')
                .set('Authorization', `Bearer ${token}`)
                .send({ mode: 'active' });
        });

        it('should broadcast an announcement', async () => {
            const res = await request(app)
                .post('/api/super-admin/settings/broadcast')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    title: 'Test Broadcast',
                    message: 'Automated test message'
                });
            
            expect(res.status).toBe(200);
            expect(res.body.message).toContain('broadcast successful');
        });
    });

    describe('🚫 Security Guardrails', () => {
        it('should block unauthorized access to super-admin routes', async () => {
            // Test with no token
            const res1 = await request(app).get('/api/super-admin/stats');
            expect(res1.status).toBe(401);

            // Test with a student role (simulated by a different login if available)
            // For now, checking rejection of empty auth is a good start
        });
    });
});
