const Subscription = require('../models/Subscription');
const DemoRequest = require('../models/DemoRequest');
const PendingVerification = require('../models/PendingVerification');
const IntelligenceLog = require('../models/IntelligenceLog');
const User = require('../models/User');
const mongoose = require('mongoose');
const crypto = require('crypto');
const provisioningService = require('../services/provisioningService');
const { sendSubscriptionNotification, sendDemoRequestNotification, sendVerificationEmail, sendPasswordSetupEmail } = require('../services/emailService');

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
        let { name, email, institutionName, phone, website } = req.body;

        if (!name || !email || !institutionName) {
            return res.status(400).json({ error: 'Name, email, and institution name are required' });
        }

        // 🛡️ 1. Normalize Email (Consistency)
        email = email.trim().toLowerCase();

        // 🛡️ 1. Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'This email is already registered. Please login to your dashboard.' });
        }

        // 🛡️ 2. Check existing approved/pending DemoRequest
        // Note: Even if it exists, we return 201 to prevent enumeration.
        const existingRequest = await DemoRequest.findOne({ email });
        if (existingRequest) {
            await IntelligenceLog.create({
                type: 'AUTH',
                severity: 'low',
                message: 'Duplicate demo request blocked (Email Discovery Protection)',
                details: { email, ip: req.ip }
            });
            return res.status(201).json({
                success: true,
                message: 'If the request is valid, a verification email has been sent.'
            });
        }

        // 🛡️ 3. OTP Generation (6-Digit Numeric)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const tokenHash = crypto.createHash('sha256').update(otp).digest('hex');
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // 🛡️ 4. Staging Data
        await PendingVerification.findOneAndDelete({ email });
        const pending = await PendingVerification.create({
            email,
            tokenHash,
            formData: { name, email, institutionName, phone, website },
            expiresAt
        });

        // 🛡️ 5. Send OTP Email
        try {
            await sendVerificationEmail({
                to: email,
                name: name,
                otp: otp // Send OTP instead of link
            });

            await IntelligenceLog.create({
                type: 'SYSTEM',
                severity: 'low',
                message: 'Demo request OTP email sent',
                details: { email, pendingId: pending._id }
            });
        } catch (emailError) {
            console.error('Email send failed:', emailError);
            await PendingVerification.findByIdAndDelete(pending._id);
            throw new Error('Failed to send verification email.');
        }

        res.status(201).json({
            success: true,
            message: 'A 6-digit verification code has been sent to your email.'
        });
    } catch (error) {
        console.error('Demo request error:', error);
        res.status(500).json({ error: error.message || 'Failed to process request.' });
    }
};

const verifyDemoRequest = async (req, res) => {
    // 🛡️ Secure Headers
    res.set('Cache-Control', 'no-store');

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required.' });
        }

        email = email.trim().toLowerCase();

        // 🛡️ 0. Idempotency Check: If user already exists, verification was likely successful already
        const existingUser = await User.findOne({ email }).session(session);
        if (existingUser) {
            console.log(`📦 [Verification] User ${email} already exists. Returning success (Idempotency).`);
            await session.commitTransaction();
            session.endSession();
            return res.status(200).json({
                success: true,
                message: 'Your account is already verified! Please check your email to set your password.',
                data: { path: 'auto' }
            });
        }

        // 🛡️ 1. Hash incoming OTP
        const tokenHash = crypto.createHash('sha256').update(otp).digest('hex');
        console.log('🛡️ [Verification] Token Hash generated:', tokenHash.substring(0, 10) + '...');

        // 🛡️ 2. Atomic Consumption
        const pending = await PendingVerification.findOneAndDelete({
            email,
            tokenHash,
            expiresAt: { $gt: new Date() }
        }).session(session);

        console.log('📦 [Verification] Pending record found?', !!pending);

        if (!pending) {
            await IntelligenceLog.create([{
                type: 'SECURITY',
                severity: 'medium',
                message: 'Failed verification attempt (Expired, Invalid, or Already Processed)',
                details: { email, ip: req.ip, userAgent: req.headers['user-agent'] }
            }], { session });
            
            await session.commitTransaction();
            return res.status(400).json({ 
                error: 'Invalid or expired verification code.',
                code: 'VERIFICATION_INVALID'
            });
        }

        // 🛡️ 3. Promotion Logic: Auto-Trial vs Manual-Review
        const { name, institutionName, phone, website } = pending.formData;

        // Simple Heuristic for Manual Review (Enterprise Path)
        // If they provide a specific domain or phone, we could check here.
        // For now, let's assume everyone gets a Trial unless they are flagged.
        const isEnterprise = false; // Placeholder for enterprise detection logic

        if (isEnterprise) {
            const newRequest = await DemoRequest.create([{
                name,
                email,
                institutionName,
                phone,
                website,
                status: 'pending'
            }], { session });

            await IntelligenceLog.create([{
                type: 'SYSTEM',
                severity: 'low',
                message: 'Demo request moved to manual review (Enterprise Path)',
                details: { email, institutionName }
            }], { session });

            await session.commitTransaction();
            session.endSession();

            // Notify Admin
            sendDemoRequestNotification({ name, email, institutionName, phone, website }).catch(err => {});

            return res.status(200).json({
                success: true,
                message: 'Verification successful! Our team will review your enterprise request.',
                path: 'manual'
            });
        }

        // 🚀 Auto-Trial Path
        const { institution, adminUser, setupToken } = await provisioningService.provisionTrialInstitution(pending.formData, session);

        await session.commitTransaction();
        session.endSession();

        // 5. Send Password Setup Email (Async)
        const frontendUrl = process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:5173';
        const setupLink = `${frontendUrl}/set-password?token=${setupToken}`;

        sendPasswordSetupEmail({
            to: adminUser.email,
            name: adminUser.name,
            institutionName: institution.name,
            setupLink
        }).catch(err => {
            console.error('Failed to send password setup email:', err);
        });

        res.status(200).json({
            success: true,
            message: 'Your trial workspace is ready! 🎉 Please check your email to set your password.',
            data: { 
                institutionName: institution.name,
                path: 'auto'
            }
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Verification error:', error);
        
        // Handle Duplicate Key Errors (E11000)
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            const message = field === 'domain' 
                ? 'This institution name/domain is already taken. Please try another.' 
                : `This ${field} is already registered.`;
            return res.status(400).json({ error: message });
        }

        res.status(500).json({ error: error.message || 'Verification failed. Please try again.' });
    }
};

const setPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ error: 'Token and password are required.' });
        }

        // 1. Hash the incoming token to find the match
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // 2. Find user with valid token
        const user = await User.findOne({
            passwordSetupToken: tokenHash,
            passwordSetupExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired setup link.' });
        }

        // 3. Update password and clear token
        user.password = password;
        user.passwordSetupToken = undefined;
        user.passwordSetupExpires = undefined;
        user.status = 'active'; // Mark as fully active
        await user.save();

        await IntelligenceLog.create({
            type: 'SECURITY',
            severity: 'low',
            message: 'Admin password set successfully during onboarding',
            details: { userId: user._id, institutionId: user.institutionId }
        });

        res.status(200).json({ 
            success: true, 
            message: 'Password set successfully. You can now login.' 
        });
    } catch (error) {
        console.error('Set password error:', error);
        res.status(500).json({ error: 'Failed to set password.' });
    }
};

module.exports = {
    subscribe,
    createDemoRequest,
    verifyDemoRequest,
    setPassword
};
