const axios = require('axios');

// Tum apni RapidAPI key .env mein rakhna ya Localhost Judge0 server ka URL dena
const JUDGE0_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
const API_KEY = process.env.JUDGE0_API_KEY; // RapidAPI Key

// Har language ka apna ID hota hai Judge0 mein
const LANGUAGE_IDS = {
  'javascript': 63, // Node.js
  'python': 71,     // Python 3
  'cpp': 54,        // C++
  'java': 62        // Java
};

/**
 * Ye function code ko run karta hai aur output lautaata hai
 * @param {string} sourceCode - Student ka likha code
 * @param {string} language - Code ki language
 * @param {string} input - Test case ka input
 */
exports.executeCode = async (sourceCode, language, input = "") => {
  try {
    const languageId = LANGUAGE_IDS[language.toLowerCase()];
    if (!languageId) throw new Error("Unsupported Language");

    const options = {
      method: 'POST',
      url: `${JUDGE0_URL}/submissions`,
      params: { base64_encoded: 'false', wait: 'true' }, // wait=true karke hum async ko sync bana lete hain
      headers: {
        'content-type': 'application/json',
        'Content-Type': 'application/json',
        ...(API_KEY && { 'X-RapidAPI-Key': API_KEY, 'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com' })
      },
      data: {
        source_code: sourceCode,
        language_id: languageId,
        stdin: input
      }
    };

    const response = await axios.request(options);
    const result = response.data;

    // Result processing
    if (result.status.id === 3) {
      // 3 means Accepted / Successfully Compiled & Run
      return { 
        success: true, 
        output: result.stdout ? result.stdout.trim() : "", 
        memory: result.memory, 
        time: result.time 
      };
    } else {
      // Compilation error, Syntax error, TLE etc.
      return { 
        success: false, 
        error: result.stderr || result.compile_output || "Execution failed",
        status: result.status.description
      };
    }

  } catch (error) {
    console.error("Judge0 API Error:", error.message);
    throw new Error("Failed to execute code on Judge0");
  }
};
