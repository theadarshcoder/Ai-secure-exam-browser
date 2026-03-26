const axios = require('axios');
require('dotenv').config();

const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com/submissions';
const JUDGE0_KEY = process.env.JUDGE0_KEY;
const JUDGE0_HOST = process.env.JUDGE0_HOST || 'judge0-ce.p.rapidapi.com';

/**
 * Submits code to Judge0 for execution and waits for result.
 * @param {string} source_code - The code to execute
 * @param {number} language_id - The ID of the language (e.g., 63 for JavaScript)
 * @param {string} stdin - Optional input for the program
 */
const executeCode = async (source_code, language_id, stdin = '') => {
  try {
    const response = await axios.post(
      `${JUDGE0_API_URL}?base64_encoded=false&wait=true`,
      {
        source_code,
        language_id,
        stdin
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': JUDGE0_KEY,
          'X-RapidAPI-Host': JUDGE0_HOST
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Judge0 Execution Error:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = { executeCode };
