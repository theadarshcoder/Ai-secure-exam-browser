const { parseLeetCode } = require('./src/utils/helpers');
const dotenv = require('dotenv');
const path = require('path');

// Load .env
dotenv.config();

async function test() {
    const url = 'https://leetcode.com/problems/two-sum/';
    console.log('Testing URL:', url);
    try {
        const result = await parseLeetCode(url);
        console.log('--- RESULT ---');
        console.log('Difficulty:', result.difficulty);
        console.log('Tags:', result.tags);
        console.log('Test Cases Count:', result.testCases.length);
        result.testCases.forEach((tc, i) => {
            console.log(`TC ${i+1}: Input: "${tc.input}", Output: "${tc.expectedOutput}"`);
        });
    } catch (err) {
        console.error('Test Failed:', err.message);
    }
}

test();
