const { getRazorpayInstance } = require('../../config/razorpay');
const crypto = require('crypto');

/**
 * 💳 Razorpay Provider Service
 * Handles direct communication with Razorpay API and signature verification.
 */

/**
 * Verify Webhook Signature
 */
const verifySignature = (rawBody, signature, secret) => {
    if (!signature || !secret) return false;
    
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');
        
    return expectedSignature === signature;
};

/**
 * Create a Subscription Link (for Checkout)
 */
const createSubscriptionLink = async (planId, institutionId) => {
    const razorpay = getRazorpayInstance();
    
    // In a real flow, you'd map our planId to Razorpay Plan IDs
    // For now, returning a mock payment link
    return {
        id: `plink_${Math.random().toString(36).substring(7)}`,
        url: `https://rzp.io/i/mock_payment_${institutionId}`,
        provider: 'razorpay'
    };
};

module.exports = {
    verifySignature,
    createSubscriptionLink
};
