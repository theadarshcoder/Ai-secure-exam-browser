const axios = require('axios');
(async () => {
  try {
    const response = await axios.post('https://ce.judge0.com/submissions', {
        source_code: 'print("hello world")',
        language_id: 71,
        stdin: ""
    }, {
        params: { base64_encoded: 'false', wait: 'true' },
        headers: {
            'Content-Type': 'application/json'
        }
    });
    console.log("Success:", JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error("Error:", JSON.stringify(err.response?.data || err.message, null, 2));
  }
})();
