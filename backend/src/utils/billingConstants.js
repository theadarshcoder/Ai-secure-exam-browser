/**
 * 💳 BILLING & SUBSCRIPTION CONSTANTS
 * Centralized source of truth for all billing logic.
 */

const PLAN_TYPES = {
    TRIAL: 'trial',
    FREE: 'free',
    BASIC: 'basic',
    STARTER: 'starter',
    PRO: 'pro',
    ENTERPRISE: 'enterprise'
};

const SUBSCRIPTION_STATUS = {
    TRIALING: 'trialing',
    ACTIVE: 'active',
    PAST_DUE: 'past_due',
    GRACE_PERIOD: 'grace_period',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled',
    SUSPENDED: 'suspended'
};

const BILLING_CYCLE = {
    MONTHLY: 'monthly',
    YEARLY: 'yearly'
};

const INVOICE_STATUS = {
    DRAFT: 'draft',
    OPEN: 'open',
    PAID: 'paid',
    VOID: 'void',
    UNCOLLECTIBLE: 'uncollectible'
};

module.exports = {
    PLAN_TYPES,
    SUBSCRIPTION_STATUS,
    BILLING_CYCLE,
    INVOICE_STATUS
};
