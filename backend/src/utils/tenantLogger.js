/**
 * Tenant-aware logger for centralized debugging and isolation visibility.
 */
const createLogger = (institutionName = 'PLATFORM') => ({
    log:   (msg) => console.log(`[${institutionName}] ${msg}`),
    error: (msg) => console.error(`[${institutionName}] ❌ ${msg}`),
    warn:  (msg) => console.warn(`[${institutionName}] ⚠️ ${msg}`),
});

module.exports = { createLogger };
