const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        const sessions = mongoose.connection.collection('examsessions');
        
        console.log('🔧 Creating index: student_1_exam_1_status_1...');
        await sessions.createIndex({ student: 1, exam: 1, status: 1 }, { name: 'student_1_exam_1_status_1' });
        
        console.log('✅ Index created successfully.');
    } catch (err) {
        console.error('❌ Error creating index:', err.message);
    } finally {
        process.exit(0);
    }
}

run();
