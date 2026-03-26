const axios = require('axios');

const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com/submissions';
const JUDGE0_KEY = process.env.JUDGE0_KEY;
const JUDGE0_HOST = process.env.JUDGE0_HOST || 'judge0-ce.p.rapidapi.com';

const executeCode = async (source_code, language_id, stdin = '') => {
    try {
        const { data } = await axios.post(`${JUDGE0_API_URL}?base64_encoded=false&wait=true`, 
            { source_code, language_id, stdin },
            { headers: { 'X-RapidAPI-Key': JUDGE0_KEY, 'X-RapidAPI-Host': JUDGE0_HOST } }
        );
        return data;
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message);
    }
};

module.exports = { executeCode };

