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
 * 🔗 LeetCode Parser
 * Fetches problem metadata via GraphQL and cleans content with Cheerio.
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

        const tags = problem.topicTags ? problem.topicTags.map(tag => tag.name) : [];

        let testCases = [];
        if (problem.exampleTestcases) {
            testCases = problem.exampleTestcases.split('\n').map((tc, index) => ({
                input: tc,
                expectedOutput: extractedOutputs[index] || "", // Pre-fill if found
                isHidden: false
            }));
        } else {
            testCases.push({ input: "", expectedOutput: "", isHidden: false });
        }

        return {
            type: 'coding',
            source: 'leetcode',
            sourceUrl: url,
            difficulty: problem.difficulty.toLowerCase(),
            tags: tags,
            questionText: `**${problem.title.toUpperCase()}**\n\n${cleanText}`,
            initialCode: `// Write your solution here\n`,
            marks: problem.difficulty === 'Hard' ? 10 : (problem.difficulty === 'Medium' ? 5 : 2),
            language: 'javascript',
            testCases: testCases
        };
    } catch (error) {
        throw new Error(`LeetCode Scraping Failed: ${error.message}`, { cause: error });
    }
};

/**
 * 🔗 CodeChef Parser
 * Basic crawler for CodeChef problem pages.
 */
const parseCodeChef = async (url) => {
    try {
        let targetUrl = url;
        
        // 🧠 Smart Fallback: If it's a course link, try to derive the public practice URL
        if (url.includes('/learn/course/')) {
            const problemCode = url.split('/').pop();
            if (problemCode) {
                targetUrl = `https://www.codechef.com/problems/${problemCode}`;
                console.log(`[CODECHEF] Course link detected. Attempting fallback to public URL: ${targetUrl}`);
            }
        }
        
        const response = await axios.get(targetUrl, { 
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }
        });
        
        const $ = cheerio.load(response.data);
        
        // Refined selectors for standard CodeChef pages
        const title = $('h1').first().text().trim() || $('title').text().split('|')[0].trim();
        const problemText = $('#problem-statement').text().trim() || $('.problem-statement').text().trim(); 

        if (!problemText || problemText.length < 50) {
            // If fallback also fails, give a clear explanation
            if (url.includes('/learn/course/')) {
                throw new Error("This problem is exclusive to a private course and has no public practice version. Manual copy-paste required.");
            }
            throw new Error("The page was fetched but the problem content was not found. The link might be protected.");
        }

        return {
            type: 'coding',
            source: 'codechef',
            sourceUrl: url,
            difficulty: 'medium',
            tags: [],
            questionText: `**${title.toUpperCase()}**\n\n${problemText}`,
            initialCode: `// Write your CodeChef logic here\n`,
            marks: 5,
            language: 'cpp',
            testCases: [{ input: "", expectedOutput: "", isHidden: false }]
        };
    } catch (error) {
        throw new Error(error.message || `CodeChef Scraping Failed.`, { cause: error });
    }
};

module.exports = { getTimeAgo, sendResponse, getRiskInfo, parseLeetCode, parseCodeChef };
