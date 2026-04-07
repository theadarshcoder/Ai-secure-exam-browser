/**
 * Formatting and Utility Helpers
 */

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

module.exports = { getTimeAgo, sendResponse, getRiskInfo };
