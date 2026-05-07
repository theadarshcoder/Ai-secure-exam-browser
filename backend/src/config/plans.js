const { PLAN_TYPES } = require('../utils/billingConstants');

/**
 * 🏢 VISION SAAS PLAN CATALOG
 * Centralized source of truth for all plan limits and features.
 */
const PLANS = {
    [PLAN_TYPES.TRIAL.toUpperCase()]: {
        id: PLAN_TYPES.TRIAL,
        name: '7-Day Free Trial',
        limits: {
            maxStudents: 50,
            maxExams: 2,
            maxMentors: 1,
            aiMinutes: 30
        },
        features: {
            ai_proctoring: true,
            detailed_reports: true,
            advanced_analytics: false,
            white_label: false,
            api_access: false,
            multi_admin: false
        }
    },
    [PLAN_TYPES.STARTER.toUpperCase()]: {
        id: PLAN_TYPES.STARTER,
        name: 'Starter Plan',
        price: {
            monthly: 29,
            yearly: 290
        },
        limits: {
            maxStudents: 200,
            maxExams: 10,
            maxMentors: 3,
            aiMinutes: 100
        },
        features: {
            ai_proctoring: true,
            detailed_reports: true,
            advanced_analytics: true,
            white_label: false,
            api_access: false,
            multi_admin: false
        }
    },
    [PLAN_TYPES.PRO.toUpperCase()]: {
        id: PLAN_TYPES.PRO,
        name: 'Professional Plan',
        price: {
            monthly: 99,
            yearly: 990
        },
        limits: {
            maxStudents: 1000,
            maxExams: 50,
            maxMentors: 10,
            aiMinutes: 500
        },
        features: {
            ai_proctoring: true,
            detailed_reports: true,
            advanced_analytics: true,
            white_label: true,
            api_access: true,
            multi_admin: true
        }
    },
    [PLAN_TYPES.ENTERPRISE.toUpperCase()]: {
        id: PLAN_TYPES.ENTERPRISE,
        name: 'Enterprise Plan',
        price: 'Custom',
        limits: {
            maxStudents: Infinity,
            maxExams: Infinity,
            maxMentors: Infinity,
            aiMinutes: Infinity
        },
        features: {
            ai_proctoring: true,
            detailed_reports: true,
            advanced_analytics: true,
            white_label: true,
            api_access: true,
            multi_admin: true,
            custom_sso: true,
            dedicated_support: true
        }
    }
};

module.exports = PLANS;
