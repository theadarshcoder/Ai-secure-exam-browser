/**
 * Formatting and Utility Helpers
 */
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Returns a human-readable relative time string (e.g., "2 min ago")
 * @param {Date|string} date 
 */
const getTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInMs = now - past;
    const diffInSec = Math.floor(diffInMs / 1000);
    const diffInMin = Math.floor(diffInSec / 60);
    const diffInHrs = Math.floor(diffInMin / 60);
    const diffInDays = Math.floor(diffInHrs / 24);

    if (diffInSec < 60) return "Just now";
    if (diffInMin < 60) return `${diffInMin} min ago`;
    if (diffInHrs < 24) return `${diffInHrs} hr ago`;
    return `${diffInDays} days ago`;
};

/**
 * Standardizes API responses for consistent frontend consumption
 */
const sendResponse = (res, statusCode, data) => {
    return res.status(statusCode).json(data);
};

/**
 * Calculates risk/warning level based on violation count
 * @param {number} count 
 */
const getRiskInfo = (count) => {
    if (count === 0) return { level: 'clean', risk: 'Low', score: 100 };
    if (count < 3)   return { level: 'minor', risk: 'Low', score: Math.max(0, 100 - (count * 5)) };
    if (count < 6)   return { level: 'moderate', risk: 'Medium', score: Math.max(0, 100 - (count * 8)) };
    if (count < 10)  return { level: 'serious', risk: 'High', score: Math.max(0, 100 - (count * 12)) };
    return { level: 'critical', risk: 'Critical', score: Math.max(0, 100 - (count * 15)) };
};

/**
 * 🤖 AI-Enhanced Parser
 * Uses Gemini AI to structure raw HTML/Text from external sources.
 */
const parseWithAI = async (rawHtml, problemTitle, difficulty, url, testcasesList) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("AI Key not configured");

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const prompt = `You are a professional coding problem parser. Your goal is to convert raw LeetCode problem data into a structured JSON format.

CONTEXT:
- Problem Name: ${problemTitle}
- URL: ${url}
- Difficulty: ${difficulty}
- Raw Example Testcases List: ${testcasesList}
- Raw HTML Content: ${rawHtml}

TASK:
1. Extract the core problem description and format it in clean, professional Markdown. Remove any LeetCode-specific internal links but keep code snippets and examples.
2. Identify all "Example" sections (Example 1, Example 2, etc.) in the content.
3. For each example, extract the EXACT "Input" and the EXACT "Output".
   - The "input" should be the raw argument values (e.g., "nums = [2,7,11,15], target = 9" should become "[2,7,11,15], 9").
   - The "expectedOutput" MUST be provided. Do not leave it empty.
4. Extract relevant topic tags.

OUTPUT FORMAT (Respond ONLY with valid JSON):
{
  "questionText": "### ${problemTitle}\\n\\n[Markdown Description]",
  "testCases": [
    { "input": "arg1, arg2", "expectedOutput": "expected_value", "isHidden": false }
  ],
  "tags": ["Tag1", "Tag2"],
  "difficulty": "${difficulty.toLowerCase()}"
}

STRICT RULES:
- Every test case MUST have an "expectedOutput". 
- If an example has "Input: nums = [3,3], target = 6" and "Output: [0,1]", then input="[3,3], 6" and expectedOutput="[0,1]".
- Ensure "questionText" is well-formatted Markdown with proper spacing.`;

    try {
        const response = await axios.post(endpoint, {
            contents: [{ parts: [{ text: prompt }] }]
        }, { timeout: 15000 });

        const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = text.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error("Invalid AI response format");
    } catch (err) {
        if (err.response) {
            console.error("AI Parsing Error (Gemini) Response:", err.response.data);
        }
        console.error("AI Parsing Error (Gemini):", err.message);
        throw err;
    }
};

/**
 * 🤖 Groq Fallback Parser
 * OpenAI-compatible endpoint for Groq AI.
 */
const parseWithGroq = async (rawHtml, problemTitle, difficulty, url, testcasesList) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("Groq Key not configured");

    const endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    
    const prompt = `You are a professional coding problem parser. Your goal is to convert raw LeetCode problem data into a structured JSON format.

CONTEXT:
- Problem Name: ${problemTitle}
- URL: ${url}
- Difficulty: ${difficulty}
- Raw Example Testcases List: ${testcasesList}
- Raw HTML Content: ${rawHtml}

TASK:
1. Extract the core problem description and format it in clean, professional Markdown.
2. Identify all "Example" sections.
3. For each example, extract EXACT "Input" and "Output".
   - Convert "Input: nums = [2,7,11,15], target = 9" to "[2,7,11,15], 9".
   - The "expectedOutput" MUST be provided.

OUTPUT FORMAT (Respond ONLY with valid JSON):
{
  "questionText": "### ${problemTitle}\\n\\n[Markdown Description]",
  "testCases": [
    { "input": "arg1, arg2", "expectedOutput": "expected_value", "isHidden": false }
  ],
  "tags": ["Tag1", "Tag2"],
  "difficulty": "${difficulty.toLowerCase()}"
}`;

    try {
        const response = await axios.post(endpoint, {
            model: 'llama-3.3-70b-specdec',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            response_format: { type: "json_object" }
        }, {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            timeout: 10000
        });

        const text = response.data.choices?.[0]?.message?.content || '';
        return JSON.parse(text);
    } catch (err) {
        console.error("AI Parsing Error (Groq):", err.message);
        throw err;
    }
};

/**
 * 🔗 LeetCode Parser
 * Fetches problem metadata via GraphQL and cleans content with AI (Gemini -> Groq -> Basic).
 */
const parseLeetCode = async (url) => {
    try {
        if (!url.includes('/problems/')) {
            throw new Error("Invalid LeetCode URL. Must be a direct problem link (e.g., /problems/title-slug/)");
        }
        const titleSlug = url.split('/problems/')[1].split('/')[0];
        if (!titleSlug) throw new Error("Could not extract title slug from URL.");
        
        const response = await axios.post('https://leetcode.com/graphql', {
            operationName: "questionData",
            variables: { titleSlug: titleSlug },
            query: `query questionData($titleSlug: String!) {
                question(titleSlug: $titleSlug) {
                    title
                    content
                    exampleTestcases
                    difficulty
                    topicTags { name }
                }
            }`
        }, { timeout: 5000 });

        const problem = response.data?.data?.question;
        if (!problem) throw new Error("Problem not found on LeetCode.");

        const tags = problem.topicTags ? problem.topicTags.map(tag => tag.name) : [];

        // --- 🤖 Tier 1: Gemini AI (Primary) ---
        if (process.env.GEMINI_API_KEY) {
            try {
                const aiResult = await parseWithAI(problem.content, problem.title, problem.difficulty, url, problem.exampleTestcases);
                
                // Filter out test cases that don't have both input and output
                const validTestCases = (aiResult.testCases || []).filter(tc => 
                    tc.input && tc.input.trim() !== "" && 
                    tc.expectedOutput && tc.expectedOutput.trim() !== ""
                );

                return {
                    type: 'coding',
                    source: 'leetcode',
                    sourceUrl: url,
                    difficulty: aiResult.difficulty || problem.difficulty.toLowerCase(),
                    tags: aiResult.tags || tags,
                    title: problem.title,
                    questionText: aiResult.questionText,
                    initialCode: `// Write your solution here\n`,
                    marks: problem.difficulty === 'Hard' ? 10 : (problem.difficulty === 'Medium' ? 5 : 2),
                    language: 'javascript',
                    testCases: validTestCases.length > 0 ? validTestCases : [{ input: "", expectedOutput: "", isHidden: false }]
                };
            } catch (aiErr) {
                console.warn("⚠️ Gemini AI failed, trying Groq fallback...");
            }
        }

        // --- 🤖 Tier 2: Groq AI (Fallback) ---
        if (process.env.GROQ_API_KEY) {
            try {
                const aiResult = await parseWithGroq(problem.content, problem.title, problem.difficulty, url, problem.exampleTestcases);
                return {
                    type: 'coding',
                    source: 'leetcode',
                    sourceUrl: url,
                    difficulty: aiResult.difficulty || problem.difficulty.toLowerCase(),
                    tags: aiResult.tags || tags,
                    title: problem.title,
                    questionText: aiResult.questionText,
                    initialCode: `// Write your solution here\n`,
                    marks: problem.difficulty === 'Hard' ? 10 : (problem.difficulty === 'Medium' ? 5 : 2),
                    language: 'javascript',
                    testCases: (aiResult.testCases || []).filter(tc => tc.input && tc.expectedOutput)
                };
            } catch (groqErr) {
                console.warn("⚠️ Groq AI failed, falling back to basic scraper:", groqErr.message);
            }
        }

        // --- 🧩 Tier 3: Basic Scraper (Last Resort) ---
        const $ = cheerio.load(problem.content);
        
        // --- Smart Output Extraction ---
        const extractedOutputs = [];
        $('pre').each((_, pre) => {
            const text = $(pre).text();
            // Regex to find content between "Output:" and ("Explanation:" or end of string)
            const match = text.match(/Output:\s*([\s\S]*?)(?=Explanation:|$)/i);
            if (match && match[1]) {
                extractedOutputs.push(match[1].trim());
            }
        });

        $('p, pre, ul, li').append('\n'); 
        const cleanText = $.text().trim();

        let testCases = [];
        if (problem.exampleTestcases) {
            const rawInputs = problem.exampleTestcases.split('\n').map(s => s.trim()).filter(s => s !== "");
            const outputCount = extractedOutputs.length;
            const inputCount = rawInputs.length;

            if (outputCount > 0 && inputCount % outputCount === 0) {
                // Smart Grouping: e.g., 6 inputs, 3 outputs => 2 inputs per TC
                const inputsPerTC = inputCount / outputCount;
                for (let i = 0; i < outputCount; i++) {
                    const group = rawInputs.slice(i * inputsPerTC, (i + 1) * inputsPerTC);
                    testCases.push({
                        input: group.join(', '),
                        expectedOutput: extractedOutputs[i].trim(),
                        isHidden: false
                    });
                }
            } else {
                // Fallback to 1:1 if mapping is unclear
                testCases = rawInputs.map((tc, index) => ({
                    input: tc,
                    expectedOutput: (extractedOutputs[index] || "").trim(),
                    isHidden: false
                })).filter(tc => tc.expectedOutput !== "");
            }
        }

        if (testCases.length === 0) {
            testCases.push({ input: "", expectedOutput: "", isHidden: false });
        }

        return {
            type: 'coding',
            source: 'leetcode',
            sourceUrl: url,
            difficulty: problem.difficulty.toLowerCase(),
            tags: tags,
            title: problem.title,
            questionText: cleanText,
            initialCode: `// Write your solution here\n`,
            marks: problem.difficulty === 'Hard' ? 10 : (problem.difficulty === 'Medium' ? 5 : 2),
            language: 'javascript',
            testCases: testCases
        };
    } catch (error) {
        throw new Error(`LeetCode Scraping Failed: ${error.message}`, { cause: error });
    }
};

module.exports = { getTimeAgo, sendResponse, getRiskInfo, parseLeetCode };
