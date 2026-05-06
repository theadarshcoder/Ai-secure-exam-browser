const axios = require('axios');
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const TARGET_USERS = 100;
const EXAM_ID = process.env.EXAM_ID || '69fb38132124dd40ec264d26';

async function runTest(studentId) {
    try {
        const email = `student_${studentId}@example.com`;
        const pass = 'password123';
        
        // 1. Login
        const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, { email, password: pass });
        const token = loginRes.data.accessToken;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        // 2. Start Exam
        let examData;
        try {
            const startRes = await axios.post(`${BASE_URL}/api/exams/start`, { examId: EXAM_ID }, config);
            examData = startRes.data.exam;
        } catch (err) {
            // Might already be started, fetch exam details
            const getRes = await axios.get(`${BASE_URL}/api/exams/${EXAM_ID}`, config);
            examData = getRes.data.exam;
        }
        
        const questionIds = examData.questions.map(q => q.id || q._id);
        
        // 3. Loop Save Progress (Simulating real interactions)
        for(let i=0; i<3; i++) {
            const start = Date.now();
            const randomQId = questionIds[Math.floor(Math.random() * questionIds.length)];
            await axios.post(`${BASE_URL}/api/exams/save-progress`, {
                examId: EXAM_ID,
                answers: { [randomQId]: `Answer from student ${studentId} iteration ${i}` },
                remainingTimeSeconds: 3000 - (i * 30)
            }, config);
            const latency = Date.now() - start;
            if (latency > 500) console.warn(`⚠️ High Latency for Student ${studentId}: ${latency}ms`);
            
            await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000)); // Random wait
        }
        
        // 4. Submit
        await axios.post(`${BASE_URL}/api/exams/submit`, { examId: EXAM_ID }, config);
        console.log(`✅ Student ${studentId} completed.`);
    } catch (e) {
        console.error(`❌ Student ${studentId} failed:`, e.response?.data || e.message);
    }
}

async function main() {
    console.log(`🚀 Starting Stress Test on ${BASE_URL} for Exam ${EXAM_ID}...`);
    console.log(`👥 Target: ${TARGET_USERS} concurrent students`);
    
    const start = Date.now();
    const tasks = [];
    for(let i=1; i<=TARGET_USERS; i++) {
        tasks.push(runTest(i));
    }
    
    await Promise.all(tasks);
    const duration = (Date.now() - start) / 1000;
    
    console.log('-------------------------------------------');
    console.log(`🏁 Stress Test Finished in ${duration}s`);
    console.log('-------------------------------------------');
    process.exit(0);
}

main();
