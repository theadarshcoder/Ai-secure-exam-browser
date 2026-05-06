const Subscription = require('../models/Subscription');
const DemoRequest = require('../models/DemoRequest');
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

const createDemoRequest = async (req, res) => {
    try {
        const { name, email, institutionName, phone, website } = req.body;

        if (!name || !email || !institutionName) {
            return res.status(400).json({ error: 'Name, email, and institution name are required' });
        }

        const newRequest = await DemoRequest.create({
            name,
            email,
            institutionName,
            phone,
            website,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Demo request submitted successfully',
            data: newRequest
        });
    } catch (error) {
        console.error('Demo request error:', error);
        res.status(500).json({ error: 'Failed to submit demo request' });
    }
};

module.exports = {
    subscribe,
    createDemoRequest
};
