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
        $('p, pre, ul, li').append('\n'); 
        const cleanText = $.text().trim();

        const tags = problem.topicTags ? problem.topicTags.map(tag => tag.name) : [];

        let testCases = [];
        if (problem.exampleTestcases) {
            testCases = problem.exampleTestcases.split('\n').map(tc => ({
                input: tc,
                expectedOutput: "", // Forced empty for manual verification
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
        throw new Error(`LeetCode Scraping Failed: ${error.message}`);
    }
};

/**
 * 🔗 CodeChef Parser
 * Basic crawler for CodeChef problem pages.
 */
const parseCodeChef = async (url) => {
    try {
        if (!url.includes('/problems/')) {
            // CodeChef problem URLs usually have /problems/ in them
            if (!url.match(/codechef\.com\/[A-Z0-9]+/i)) {
                throw new Error("Invalid CodeChef URL.");
            }
        }
        const response = await axios.get(url, { timeout: 5000 });
        const $ = cheerio.load(response.data);
        
        const title = $('h1').first().text().trim() || "CodeChef Problem";
        const problemText = $('#problem-statement').text().trim(); 

        return {
            type: 'coding',
            source: 'codechef',
            sourceUrl: url,
            difficulty: 'medium',
            tags: [],
            questionText: `**${title}**\n\n${problemText || "Please refer to the problem link for full details."}`,
            initialCode: `// Write your CodeChef logic here\n`,
            marks: 5,
            language: 'cpp',
            testCases: [{ input: "", expectedOutput: "", isHidden: false }]
        };
    } catch (error) {
        throw new Error(`CodeChef Scraping Failed: ${error.message}`);
    }
};

module.exports = { getTimeAgo, sendResponse, getRiskInfo, parseLeetCode, parseCodeChef };
