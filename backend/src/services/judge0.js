const axios = require('axios');

const JUDGE0_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
const API_KEY = process.env.JUDGE0_API_KEY;

const LANGUAGE_IDS = {
  'javascript': 63,
  'python': 71,
  'cpp': 54,
  'java': 62
};

const PISTON_LANGUAGES = {
  'javascript': { language: 'javascript', version: '18.15.0' },
  'python': { language: 'python', version: '3.10.0' },
  'cpp': { language: 'c++', version: '10.2.0', aliases: ['cpp', 'c++'] },
  'java': { language: 'java', version: '15.0.2' }
};

exports.executeCode = async (sourceCode, language, input = "") => {
  try {
    if (API_KEY) {
      const languageId = LANGUAGE_IDS[language.toLowerCase()];
      if (!languageId) throw new Error("Unsupported Language");
      
      const options = {
        method: 'POST',
        url: `${JUDGE0_URL}/submissions`,
        params: { base64_encoded: 'false', wait: 'true' },
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
        data: { source_code: sourceCode, language_id: languageId, stdin: input }
      };

      const response = await axios.request(options);
      const result = response.data;
      if (result.status.id === 3) {
        return { success: true, output: result.stdout ? result.stdout.trim() : "", memory: result.memory, time: result.time };
      } else {
        return { success: false, error: result.stderr || result.compile_output || "Execution failed", status: result.status.description };
      }
    }

    // Fallback to Piston API if no Judge0 Key is found
    const langKey = language.toLowerCase();
    const pistonLang = PISTON_LANGUAGES[langKey] || Object.values(PISTON_LANGUAGES).find(l => l.aliases && l.aliases.includes(langKey));
    if (!pistonLang) throw new Error("Unsupported Language for Piston fallback");

    const pistonOptions = {
        language: pistonLang.language,
        version: pistonLang.version,
        files: [{ content: sourceCode }],
        stdin: String(input)
    };

    const response = await axios.post('https://emkc.org/api/v2/piston/execute', pistonOptions);
    const result = response.data;

    if (result.run && result.run.code === 0) {
      return { success: true, output: result.run.stdout ? result.run.stdout.trim() : "", memory: 0, time: 0 };
    } else {
      const errStr = result.compile ? result.compile.stderr : (result.run ? result.run.stderr || result.run.stdout : "Execution failed");
      return { success: false, error: errStr.trim(), status: "Error" };
    }

  } catch (error) {
    console.error("Code Execution Error:", error.message);
    throw new Error("Failed to execute code: " + (error.response?.data?.message || error.message));
  }
};
