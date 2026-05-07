const { AsyncLocalStorage } = require('async_hooks');

/**
 * AsyncLocalStorage instance to hold request-scoped context.
 * Useful for logging requestId, userId, etc. across async boundaries
 * without explicitly passing them as arguments.
 */
const storage = new AsyncLocalStorage();

/**
 * Helper to get the current context
 * @returns {Object|undefined}
 */
const getContext = () => storage.getStore();

/**
 * Helper to get the current Request ID
 * @returns {string|undefined}
 */
const getRequestId = () => getContext()?.requestId;

module.exports = {
    storage,
    getContext,
    getRequestId
};
