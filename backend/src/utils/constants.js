/**
 * Standardized Violation Types
 * Used to ensure consistency between socket engine, controllers, and frontend.
 */
const VIOLATION_TYPES = {
    TAB_SWITCH: 'Tab Switch',
    ENVIRONMENT_TAMPERING: 'Environment Tampering',
    INVALID_DATA: 'Invalid Data',
    SUSPICIOUS_ACTIVITY: 'Suspicious Activity',
    SESSION_HASH_MISMATCH: 'Session Hash Mismatch',
    VIOLATION_BLOCK: 'VIOLATION_BLOCK'
};

/**
 * Standardized Session Statuses
 */
const SESSION_STATUS = {
    IN_PROGRESS: 'in_progress',
    FLAGGED: 'flagged',
    SUBMITTED: 'submitted',
    AUTO_SUBMITTED: 'auto_submitted',
    BLOCKED: 'blocked'
};

module.exports = { VIOLATION_TYPES, SESSION_STATUS };
