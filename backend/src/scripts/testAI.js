const { generateQuestions } = require('../controllers/aiController');
const mongoose = require('mongoose');
const Institution = require('../models/Institution');
const User = require('../models/User');
require('dotenv').config();

const testAI = async () => {
    try {
        console.log('--- AI SERVICE TEST START ---');
        
        // 1. Setup DB Connection (Required for Institution check if we were using middleware, 
        // but here we call the controller directly. However, some controllers might use DB)
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 2. Mock Request and Response
        const req = {
            body: {
                category: 'Javascript',
                syllabus: 'Variables, Closures, Async/Await',
                config: {
                    mcq: 2,
                    short: 1,
                    coding: 1
                },
                totalMarks: 20
            }
        };

        const res = {
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                console.log('📩 Response Status:', this.statusCode || 200);
                console.log('📩 Response Data:', JSON.stringify(data, null, 2));
                return this;
            }
        };

        const next = (err) => {
            console.error('❌ Controller called next(err):', err.message);
            if (err.stack) console.error(err.stack);
        };

        // 3. Execute Controller
        console.log('🚀 Calling generateQuestions controller...');
        await generateQuestions(req, res, next);

        console.log('--- AI SERVICE TEST END ---');
        process.exit(0);
    } catch (error) {
        console.error('💥 TEST CRASHED:', error.message);
        process.exit(1);
    }
};

testAI();
