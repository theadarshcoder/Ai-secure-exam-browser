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

// ─── POST /api/billing/request-upgrade ──────────────────
// Handles manual payment submission with Transaction ID
exports.requestUpgrade = asyncHandler(async (req, res) => {
    const { plan, transactionId } = req.body;
    const UpgradeRequest = require('../models/UpgradeRequest');
    const Institution = require('../models/Institution');
    const { sendUpgradeRequestAlert } = require('../services/emailService');

    if (!plan || !transactionId) {
        throw new AppError('Plan and Transaction ID are required', 400);
    }

    const request = await UpgradeRequest.create({
        institutionId: req.user.institutionId,
        requestedBy: req.user.id,
        plan,
        transactionId
    });

    // 🚀 Send Email Alert to Vinit (Async)
    Institution.findById(req.user.institutionId).then(inst => {
        if (inst) {
            sendUpgradeRequestAlert({
                institutionName: inst.name,
                plan,
                transactionId,
                requestedBy: req.user.email || req.user.name
            }).catch(err => console.error('Upgrade Email Alert Failed:', err));
        }
    });

    res.status(201).json({
        message: 'Upgrade request submitted successfully. Our team will verify and activate your plan shortly.',
        request
    });
});
