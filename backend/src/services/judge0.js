const axios = require('axios');

// ─── Judge0 Endpoints (tried in order if one fails/times out) ───
const JUDGE0_ENDPOINTS = [
  // 1. User-configured (env var) — fastest if set
  process.env.JUDGE0_API_URL,
  // 2. Official free tier — 50 req/day, no key needed
  'https://ce.judge0.com',
].filter(Boolean);

const JUDGE0_URL = JUDGE0_ENDPOINTS[0];
const API_KEY = process.env.JUDGE0_API_KEY;

// Request timeout — fail fast if Judge0 is slow (10 seconds max)
const EXECUTION_TIMEOUT_MS = 10000;

const LANGUAGE_IDS = {
  'javascript': 63,
  'python':     71,
  'cpp':        54,
  'java':       62,
  'c':          50,
  'typescript': 74,
  'go':         60,
  'rust':       73,
};

/**
 * Try a single Judge0 endpoint with timeout.
 */
async function tryEndpoint(url, languageId, sourceCode, input, apiKey) {
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) {
    if (url.includes('rapidapi')) {
      headers['X-RapidAPI-Key'] = apiKey;
      headers['X-RapidAPI-Host'] = new URL(url).host;
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
  }

  const response = await axios.request({
    method: 'POST',
    url: `${url}/submissions`,
    params: { base64_encoded: 'false', wait: 'true' },
    headers,
    data: { source_code: sourceCode, language_id: languageId, stdin: input || '' },
    timeout: EXECUTION_TIMEOUT_MS,
  });

  return response.data;
}

/**
 * Execute code via Judge0. Tries multiple endpoints in order.
 * Falls back to next endpoint on timeout or error.
 */
exports.executeCode = async (sourceCode, language, input = '') => {
  const languageId = LANGUAGE_IDS[language.toLowerCase()];
  if (!languageId) throw new Error(`Unsupported language: ${language}`);

  let lastError = null;

  for (const url of JUDGE0_ENDPOINTS) {
    try {
      console.log(`[Judge0] Trying ${url} ...`);
      const result = await tryEndpoint(url, languageId, sourceCode, input, API_KEY);

      // Status 3 = Accepted (successful run)
      if (result.status?.id === 3) {
        return {
          success: true,
          output: result.stdout ? result.stdout.trim() : '',
          memory: result.memory,
          time: result.time,
        };
      }

      // Status 1 or 2 = queued/processing — shouldn't happen with wait:true but handle it
      if (result.status?.id === 1 || result.status?.id === 2) {
        return {
          success: false,
          error: 'Judge0 server is busy. Please try again in a moment.',
          status: result.status?.description,
        };
      }

      // Compile error, runtime error, TLE, etc.
      return {
        success: false,
        error: result.stderr || result.compile_output || result.message || 'Execution failed',
        status: result.status?.description || 'Error',
      };

    } catch (err) {
      const isTimeout = err.code === 'ECONNABORTED' || err.message.includes('timeout');
      console.warn(`[Judge0] ${url} failed: ${isTimeout ? 'TIMEOUT' : err.message}`);
      lastError = isTimeout
        ? new Error('Code execution timed out. Judge0 server is busy.')
        : err;
      // Try next endpoint
    }
  }

  // All endpoints failed
  throw new Error(
    lastError?.message ||
    'All Judge0 servers are unavailable. Please try again shortly.'
  );
};
