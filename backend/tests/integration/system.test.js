const request = require('supertest');
const express = require('express');
const { securityHeaders } = require('../../src/middlewares/securityMiddleware');
const responseStandardizer = require('../../src/middlewares/responseMiddleware');
const traceMiddleware = require('../../src/middlewares/traceMiddleware');

// We'll create a mock app for testing system routes without full DB/Redis for now
// to ensure the middleware chain works as expected.
const app = express();
app.use(traceMiddleware);
app.use(responseStandardizer);

app.get('/health/live', (req, res) => res.json({ status: 'UP' }));
app.get('/version', (req, res) => res.json({ version: '1.0.0' }));

describe('System Integration Tests', () => {
    test('GET /health/live should return standardized success response', async () => {
        const response = await request(app).get('/health/live');
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('UP');
        expect(response.body.meta).toHaveProperty('requestId');
    });

    test('GET /version should return standardized success response', async () => {
        const response = await request(app).get('/version');
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.version).toBe('1.0.0');
    });

    test('GET /invalid-route should return standardized error response', async () => {
        // We need a 404 handler for this test in the mock app
        app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

        const response = await request(app).get('/api/invalid');
        
        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('API_ERROR');
    });
});
