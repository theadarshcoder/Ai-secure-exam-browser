const axios = require('axios');
(async () => {
  try {
    const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
        language: 'python',
        version: '3.10.0',
        files: [{ content: 'def is_palindrome(s):\n    s = s.replace(" ", "").lower()\n    return s == s[::-1]' }],
        stdin: ""
    });
    console.log("Success:", JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error("Error:", JSON.stringify(err.response?.data || err.message, null, 2));
  }
})();
