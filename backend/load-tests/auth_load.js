import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * k6 Load Test: Login Burst
 * 
 * Scenario: 
 * 1. Simulates a sudden spike of students logging in at the start of an exam.
 * 2. This tests Bcrypt CPU load and MongoDB connection pooling.
 */

export const options = {
    stages: [
        { duration: '30s', target: 100 }, // Sudden spike to 100 users
        { duration: '1m', target: 200 },  // Increase to 200
        { duration: '30s', target: 0 },   // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(99)<2000'], // 99% of logins should be under 2s (Bcrypt is slow by design)
        http_req_failed: ['rate<0.05'],    // Allow 5% failure under extreme burst
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
    const payload = JSON.stringify({
        email: `student_${Math.floor(Math.random() * 1000)}@example.com`,
        password: 'password123'
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const res = http.post(`${BASE_URL}/api/auth/login`, payload, params);

    check(res, {
        'status is 200': (r) => r.status === 200,
        'has token': (r) => r.json().token !== undefined,
    });

    sleep(1); // Stagger requests slightly
}
