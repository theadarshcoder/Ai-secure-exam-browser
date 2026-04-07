const axios = require('axios');

// Default strictly to the public free tier that doesn't need API keys
const DEFAULT_JUDGE0_URL = 'https://ce.judge0.com';
const JUDGE0_URL = process.env.JUDGE0_API_URL || DEFAULT_JUDGE0_URL;
const API_KEY = process.env.JUDGE0_API_KEY;

const LANGUAGE_IDS = {
  'javascript': 63,
  'python': 71,
  'cpp': 54,
  'java': 62
};

exports.executeCode = async (sourceCode, language, input = "") => {
  try {
    const languageId = LANGUAGE_IDS[language.toLowerCase()];
    if (!languageId) throw new Error("Unsupported Language");
    
    // Auto-detect if we need to send RapidAPI headers based on the URL or if Key is present
    const headers = { 'Content-Type': 'application/json' };
    if (API_KEY) {
      if (JUDGE0_URL.includes('rapidapi')) {
        headers['X-RapidAPI-Key'] = API_KEY;
        headers['X-RapidAPI-Host'] = new URL(JUDGE0_URL).host;
      } else {
        headers['Authorization'] = `Bearer ${API_KEY}`;
      }
    }

    const options = {
      method: 'POST',
      url: `${JUDGE0_URL}/submissions`,
      params: { base64_encoded: 'false', wait: 'true' },
      headers,
      data: { source_code: sourceCode, language_id: languageId, stdin: input }
    };

    const response = await axios.request(options);
    const result = response.data;
    if (result.status.id === 3) {
      return { success: true, output: result.stdout ? result.stdout.trim() : "", memory: result.memory, time: result.time };
    } else {
      return { success: false, error: result.stderr || result.compile_output || "Execution failed", status: result.status.description };
    }

  } catch (error) {
    console.error("Code Execution Error:", error.message);
    throw new Error("Failed to execute code: " + (error.response?.data?.message || error.message));
  }
};
