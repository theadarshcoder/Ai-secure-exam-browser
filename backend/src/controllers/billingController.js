const Subscription = require('../models/Subscription');
const InstitutionUsage = require('../models/InstitutionUsage');
const featureService = require('../services/featureService');
const PLANS = require('../config/plans');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const AppError = require('../utils/AppError');

/**
 * 💳 Billing Controller
 * Handles subscription details, plan info, and usage dashboard data.
 */

// ─── GET /api/billing/status ────────────────────────────
// Returns detailed usage vs plan limits for the dashboard
exports.getSubscriptionStatus = asyncHandler(async (req, res) => {
    const institutionId = req.user.institutionId;
    if (!institutionId) throw new AppError('Institution context missing.', 400);

    const sub = await Subscription.findOne({ institutionId });
    if (!sub) throw new AppError('No active subscription found.', 404);

    // Get current plan config
    const plan = PLANS[sub.planId.toUpperCase()];

    // Get usage stats for all major resources
    const [exams, students, ai] = await Promise.all([
        featureService.getQuotaStatus(institutionId, 'exam'),
        featureService.getQuotaStatus(institutionId, 'student'),
        featureService.getQuotaStatus(institutionId, 'aiMinutes')
    ]);

    res.json({
        plan: {
            id: sub.planId,
            name: plan.name,
            status: sub.status,
            expiresAt: sub.currentPeriodEnd,
            trialEndsAt: sub.trialEndsAt
        },
        usage: {
            exams,
            students,
            ai
        },
        features: plan.features
    });
});

// ─── POST /api/billing/create-checkout ──────────────────
// Placeholder for Razorpay/Stripe checkout session
exports.createCheckout = asyncHandler(async (req, res) => {
    const { planId, billingCycle } = req.body;
    
    if (!PLANS[planId.toUpperCase()]) {
        throw new AppError('Invalid plan selected.', 400);
    }

    // In a real implementation, you would:
    // 1. Create a Stripe/Razorpay session
    // 2. Return the checkout URL
    
    res.json({
        message: 'Checkout session created (Mock)',
        checkoutUrl: 'https://checkout.stripe.com/pay/mock_session',
        planId,
        billingCycle
    });
});
