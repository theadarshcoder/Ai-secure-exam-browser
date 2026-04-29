const Subscription = require('../models/Subscription');
const { sendSubscriptionNotification } = require('../services/emailService');

const subscribe = async (req, res) => {
    try {
        const { email, message } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Save to database
        const newSub = await Subscription.create({ email, message });

        // Send email notification to admin asynchronously (don't block response)
        sendSubscriptionNotification({ email, message }).catch(err => {
            console.error('Failed to send subscription notification email:', err);
        });

        res.status(201).json({
            success: true,
            message: 'Successfully subscribed'
        });
    } catch (error) {
        console.error('Subscription error:', error);
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        res.status(500).json({ error: 'Failed to process subscription. Please try again later.' });
    }
};

module.exports = {
    subscribe
};
