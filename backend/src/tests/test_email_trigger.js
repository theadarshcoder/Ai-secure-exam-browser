const axios = require('axios');

/**
 * 📧 Demo Request Email Verification Script
 */

const BASE_URL = 'http://localhost:5001/api/public';

async function testDemoRequest() {
    console.log('🚀 Sending Demo Request to trigger email...');
    
    try {
        const payload = {
            name: 'Vinit Jangir (Test)',
            email: 'vinit.test@example.com',
            institutionName: 'Vision Tech Institute',
            phone: '+91 9999999999',
            website: 'https://vision-exam.com'
        };

        const res = await axios.post(`${BASE_URL}/demo-request`, payload);
        
        console.log('✅ Request status:', res.status);
        console.log('✅ Response:', res.data.message);
        console.log('\n📧 System should now be sending an email to vinitjangirr@gmail.com');
        console.log('Check your Brevo dashboard or vinitjangirr@gmail.com inbox.');
        
    } catch (error) {
        console.error('❌ Failed to trigger demo request:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data:`, error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testDemoRequest();
