const axios = require('axios');
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const TARGET_USERS = 200;
const EXAM_ID = process.env.EXAM_ID;

async function prepareStudent(studentId) {
    try {
        const email = `student_${studentId}@example.com`;
        const pass = 'password123';
        
        // 1. Login
        const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, { email, password: pass });
        const token = loginRes.data.accessToken;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        // 2. Start Exam (if not already started)
        try {
            await axios.post(`${BASE_URL}/api/exams/start`, { examId: EXAM_ID }, config);
        } catch (e) {}

        return config;
    } catch (e) {
        console.error(`❌ Student ${studentId} preparation failed:`, e.message);
        return null;
    }
}

async function submitExam(studentId, config) {
    if (!config) return;
    try {
        const start = Date.now();
        await axios.post(`${BASE_URL}/api/exams/submit`, { examId: EXAM_ID }, config);
        const latency = Date.now() - start;
        console.log(`✅ Student ${studentId} submitted in ${latency}ms`);
        return latency;
    } catch (e) {
        console.error(`❌ Student ${studentId} submission failed:`, e.response?.data || e.message);
        return null;
    }
}

async function main() {
    if (!EXAM_ID) {
        console.error('❌ Please provide EXAM_ID environment variable.');
        process.exit(1);
    }

    console.log(`🚀 Preparing ${TARGET_USERS} students for Submission Burst Test...`);
    const preparations = [];
    for (let i = 1; i <= TARGET_USERS; i++) {
        preparations.push(prepareStudent(i));
    }
    const configs = await Promise.all(preparations);
    const validConfigs = configs.filter(c => c !== null);

    console.log(`🔥 Preparation complete (${validConfigs.length} ready). Launching BURST in 3 seconds...`);
    await new Promise(r => setTimeout(r, 3000));

    const start = Date.now();
    const submissions = validConfigs.map((config, index) => submitExam(index + 1, config));
    
    const results = await Promise.all(submissions);
    const end = Date.now();
    
    const successCount = results.filter(r => r !== null).length;
    const totalDuration = (end - start) / 1000;
    
    console.log('-------------------------------------------');
    console.log(`🏁 Submission Burst Finished in ${totalDuration}s`);
    console.log(`📈 Success: ${successCount} / ${validConfigs.length}`);
    console.log('-------------------------------------------');
    process.exit(0);
}

main();
