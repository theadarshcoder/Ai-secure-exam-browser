import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * k6 Load Test: Exam Progress (Dirty Saves)
 * 
 * Scenario: 
 * 1. VU logins and gets token.
 * 2. Starts or resumes an exam.
 * 3. Every 30 seconds, sends a "dirty" save (only 1-2 questions changed).
 * 4. Finally submits.
 */

export const options = {
    stages: [
        { duration: '1m', target: 50 },  // Ramp up to 50 users
        { duration: '3m', target: 50 },  // Stay at 50 users
        { duration: '1m', target: 0 },   // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
        http_req_failed: ['rate<0.01'],   // Error rate should be less than 1%
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const EXAM_ID = __ENV.EXAM_ID || '661234567890abcdef123456'; // Replace with real ID during test

export default function () {
    // 1. LOGIN (Simplified for testing - ideally use a pool of test accounts)
    // For local testing, you might want to skip real bcrypt by using a 'test-token' or similar
    // Or use real accounts if testing production.
    const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
        email: `student_${__VU}@example.com`,
        password: 'password123'
    }), { headers: { 'Content-Type': 'application/json' } });

    if (!check(loginRes, { 'logged in': (r) => r.status === 200 })) {
        console.error(`VU ${__VU} failed to login`);
        return;
    }

    const token = loginRes.json('token');
    const authHeaders = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // 2. START EXAM
    const startRes = http.post(`${BASE_URL}/api/exams/start`, JSON.stringify({
        examId: EXAM_ID
    }), { headers: authHeaders });

    check(startRes, { 'exam started': (r) => r.status === 200 || r.status === 201 });

    // 3. LOOP: SAVE PROGRESS
    for (let i = 0; i < 5; i++) { // Simulate 2.5 minutes of exam
        const qId = `q_${Math.floor(Math.random() * 50)}`; // Random question ID
        const payload = {
            examId: EXAM_ID,
            answers: { [qId]: 'Random Answer String' }, // Dirty save: only 1 answer
            currentQuestionIndex: Math.floor(Math.random() * 50),
            remainingTimeSeconds: 3600 - (i * 30),
            lastUpdated: Date.now()
        };

        const saveRes = http.post(`${BASE_URL}/api/exams/save-progress`, JSON.stringify(payload), {
            headers: authHeaders
        });

        check(saveRes, { 'progress saved': (r) => r.status === 200 });
        
        sleep(30); // Real student wait time
    }

    // 4. SUBMIT EXAM
    const submitRes = http.post(`${BASE_URL}/api/exams/submit`, JSON.stringify({
        examId: EXAM_ID
    }), { headers: authHeaders });

    check(submitRes, { 'exam submitted': (r) => r.status === 200 });
}
