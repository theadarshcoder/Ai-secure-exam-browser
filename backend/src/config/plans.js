const { PLAN_TYPES } = require('../utils/billingConstants');

/**
 * 🏢 VISION SAAS PLAN CATALOG
 * Centralized source of truth for all plan limits and features.
 */
const PLANS = {
    [PLAN_TYPES.TRIAL.toUpperCase()]: {
        id: PLAN_TYPES.TRIAL,
        name: '7-Day Free Trial',
        limits: { maxStudents: 50, maxExams: 5, maxMentors: 2, aiMinutes: 30 }
    },
    [PLAN_TYPES.FREE.toUpperCase()]: {
        id: PLAN_TYPES.FREE,
        name: 'Free Tier',
        limits: { maxStudents: 20, maxExams: 2, maxMentors: 1, aiMinutes: 10 }
    },
    [PLAN_TYPES.BASIC.toUpperCase()]: {
        id: PLAN_TYPES.BASIC,
        name: 'Basic Plan',
        limits: { maxStudents: 200, maxExams: 20, maxMentors: 5, aiMinutes: 100 }
    },
    [PLAN_TYPES.PRO.toUpperCase()]: {
        id: PLAN_TYPES.PRO,
        name: 'Professional Plan',
        limits: { maxStudents: 1000, maxExams: 100, maxMentors: 20, aiMinutes: 500 }
    },
    [PLAN_TYPES.ENTERPRISE.toUpperCase()]: {
        id: PLAN_TYPES.ENTERPRISE,
        name: 'Enterprise Plan',
        limits: { maxStudents: 10000, maxExams: 1000, maxMentors: 100, aiMinutes: 5000 }
    }
};

module.exports = PLANS;
