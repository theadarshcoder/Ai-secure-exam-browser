const Razorpay = require('razorpay');

/**
 * 💳 Razorpay Configuration
 * Production-ready guard to prevent crashes if environment keys are missing.
 */

let razorpay = null;

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (KEY_ID && KEY_SECRET) {
    razorpay = new Razorpay({
        key_id: KEY_ID,
        key_secret: KEY_SECRET,
    });
    console.log(`💳 [Billing] Razorpay initialized in ${process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'SANDBOX'} mode.`);
} else {
    console.warn('⚠️  [Billing] Razorpay keys missing. Payment processing will be unavailable.');
}

const isRazorpayConfigured = () => !!razorpay;
const getRazorpayInstance = () => {
    if (!razorpay) throw new Error('Razorpay is not configured. Check your environment variables.');
    return razorpay;
};

module.exports = {
    razorpay,
    getRazorpayInstance,
    isRazorpayConfigured
};
