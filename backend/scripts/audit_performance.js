const mongoose = require('mongoose');
const { getRedisClient } = require('../src/config/redis');
require('dotenv').config();

async function audit() {
    console.log('🚀 Starting Platform Performance Audit...');
    
    // 1. MongoDB Connection & Index Audit
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected.');
        
        const sessions = mongoose.connection.collection('examsessions');
        const indexes = await sessions.indexes();
        
        const requiredIndexes = [
            'student_1_exam_1_status_1',
            'institutionId_1_status_1',
            'exam_1_status_1'
        ];
        
        console.log('📊 Indexing Audit:');
        requiredIndexes.forEach(req => {
            const exists = indexes.find(idx => idx.name === req);
            if (exists) {
                console.log(`   [OK] ${req}`);
            } else {
                console.warn(`   [MISSING] ${req} - Performance might be degraded for analytics.`);
            }
        });
    } catch (err) {
        console.error('❌ MongoDB Audit Failed:', err.message);
    }

    // 2. Redis Connection & Feature Audit
    try {
        const redis = getRedisClient();
        if (!redis) {
            console.error('❌ Redis Client not initialized.');
        } else {
            console.log('✅ Redis Client initialized.');
            
            // Test basic ping
            const ping = await redis.ping();
            console.log(`✅ Redis Ping: ${ping}`);
            
            // Test Cluster vs Standalone capability
            const isCluster = redis.isCluster || !!redis.nodes;
            console.log(`📡 Redis Mode: ${isCluster ? 'CLUSTER' : 'STANDALONE'}`);
            
            // Test rate-limit command capability
            const testKey = 'audit_test_key';
            await redis.call('SET', testKey, 'performance_ok', 'EX', 10);
            const val = await redis.call('GET', testKey);
            if (val === 'performance_ok') {
                console.log('✅ Redis Command Wrapper (.call) verified for ioredis v5.');
            } else {
                console.error('❌ Redis Command Wrapper (.call) failed.');
            }
        }
    } catch (err) {
        console.error('❌ Redis Audit Failed:', err.message);
    }

    console.log('🏁 Audit Complete.');
    process.exit(0);
}

audit();
