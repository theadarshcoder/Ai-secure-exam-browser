// ═══════════════════════════════════════════════════════════
//  📧 Email Service — Brevo (HTTP API via Axios)
//  Bypasses Render's SMTP Port Blocks for 100% Reliability
// ═══════════════════════════════════════════════════════════

const axios = require('axios');
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

/**
 * Send an email using Brevo HTTP API.
 */
const sendEmail = async ({ to, subject, htmlContent, senderName }) => {
    // 🛡️ Priority 1: Brevo API (Cloud Scaling)
    if (process.env.BREVO_API_KEY) {
        try {
            const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
                sender: { 
                    name: senderName || "Vision Exam Platform", 
                    email: process.env.EMAIL_USER 
                },
                to: [{ email: to }],
                subject: subject,
                htmlContent: htmlContent
            }, {
                headers: {
                    'api-key': process.env.BREVO_API_KEY,
                    'Content-Type': 'application/json'
                }
            });

            logger.info({ to, messageId: response.data.messageId }, `📧 [Brevo SUCCESS]: Sent to ${to}`);
            return { success: true, id: response.data.messageId };
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message;
            logger.error({ err: errorMsg, to, subject }, '❌ [Brevo FAILED]');
            // Fallback to SMTP if configured
        }
    }

    // 🛡️ Priority 2: Nodemailer/SMTP (Local/Legacy Fallback)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const info = await transporter.sendMail({
                from: `"${senderName || 'Vision Exam Platform'}" <${process.env.EMAIL_USER}>`,
                to,
                subject,
                html: htmlContent
            });

            logger.info({ to, messageId: info.messageId }, `📧 [SMTP SUCCESS]: Sent to ${to}`);
            return { success: true, id: info.messageId };
        } catch (error) {
            logger.error({ err: error.message, to }, '❌ [SMTP FAILED]');
            return { success: false, error: error.message };
        }
    }

    throw new Error('Email configuration missing! Please add BREVO_API_KEY or EMAIL_USER/PASS to .env');
};

const sendBrevoEmail = sendEmail;

/**
 * Send an exam invite email to a student.
 */
const sendInviteEmail = async ({ to, studentName, password, examName, verifyLink, expiresAt }) => {
    const expiryDate = new Date(expiresAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata'
    });

    const htmlContent = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,sans-serif;">
    <div style="max-width:520px;margin:32px auto;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div style="background:linear-gradient(135deg,#10b981,#059669);padding:28px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;">Vision Exam Platform</h1>
        </div>
        <div style="padding:28px;">
            <p>Hi <strong>${studentName}</strong>,</p>
            <p>You have been invited to take the exam: <strong>${examName}</strong></p>
            <div style="background-color:#fafafa;padding:16px;border-radius:8px;margin:20px 0;">
                <p style="margin:0;font-size:13px;">Email: <strong>${to}</strong></p>
                <p style="margin:0;font-size:13px;">Password: <strong>${password}</strong></p>
            </div>
            <div style="text-align:center;">
                <a href="${verifyLink}" style="display:inline-block;background-color:#10b981;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;">Start Your Exam</a>
            </div>
            <p style="font-size:12px;color:#92400e;background-color:#fef3c7;padding:12px;border-radius:8px;margin-top:24px;">
                Note: Expires on ${expiryDate}
            </p>
        </div>
    </div>
</body>
</html>`;

    return await sendBrevoEmail({
        to,
        subject: `You're Invited: ${examName} — Vision`,
        htmlContent,
        senderName: "Vision Exam Platform"
    });
};

/**
 * Send a notification to the admin about a new subscriber/contact.
 */
const sendSubscriptionNotification = async ({ email, message }) => {
    const adminEmail = 'vinitjangirr@gmail.com';
    const htmlContent = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
            <h2 style="color: #10b981;">New Contact Alert</h2>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong><br/>${message || 'No message'}</p>
        </div>`;

    return await sendBrevoEmail({
        to: adminEmail,
        subject: `New Contact from ${email}`,
        htmlContent,
        senderName: "Vision Alerts"
    });
};

const sendDemoRequestNotification = async (details) => {
    const adminEmail = 'vinitjangirr@gmail.com';
    const { name, email, institutionName, phone, website } = details;
    
    const htmlContent = `
        <div style="padding: 20px; font-family: Arial, sans-serif; background-color: #f9f9f9; border-radius: 12px;">
            <h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px;">New Demo Request 🚀</h2>
            <div style="margin-top: 20px;">
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Institution:</strong> ${institutionName}</p>
                <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                <p><strong>Website:</strong> ${website || 'Not provided'}</p>
            </div>
            <p style="margin-top: 30px; font-size: 12px; color: #666;">This request was submitted from the Vision landing page.</p>
        </div>`;

    return await sendBrevoEmail({
        to: adminEmail,
        subject: `🚨 New Demo Request: ${institutionName}`,
        htmlContent,
        senderName: "Vision Alerts"
    });
};

const sendAccessApprovedEmail = async ({ to, name, institutionName, password, institutionCode }) => {
    const loginLink = process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:5173/login';
    
    const htmlContent = `
        <div style="padding: 24px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #10b981; margin: 0; font-size: 24px;">Welcome to Vision Platform 🚀</h1>
                <p style="color: #6b7280; margin-top: 8px;">Your Institutional Access has been approved!</p>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px 0;">Hi <strong>${name}</strong>,</p>
                <p style="margin: 0; line-height: 1.6;">Congratulations! Your request for <strong>${institutionName}</strong> has been processed. You can now start managing your exams and mentors on our secure platform.</p>
            </div>

            <div style="padding: 20px; border: 1px dashed #10b981; border-radius: 12px; margin-bottom: 24px;">
                <h3 style="margin-top: 0; font-size: 14px; color: #059669; text-transform: uppercase; letter-spacing: 0.05em;">Your Admin Credentials</h3>
                <p style="margin: 8px 0; font-size: 14px;">Institution Code: <code style="background: #ecfdf5; padding: 2px 4px; border-radius: 4px; font-weight: bold;">${institutionCode}</code></p>
                <p style="margin: 8px 0; font-size: 14px;">Login Email: <strong>${to}</strong></p>
                <p style="margin: 8px 0; font-size: 14px;">Password: <strong style="color: #10b981;">${password}</strong></p>
            </div>

            <div style="text-align: center;">
                <a href="${loginLink}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 14px 40px; border-radius: 12px; text-decoration: none; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);">Go to Dashboard</a>
            </div>

            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af; text-align: center;">
                <p>&copy; ${new Date().getFullYear()} Vision Exam Platform. Built for Excellence.</p>
            </div>
        </div>`;

    return await sendBrevoEmail({
        to,
        subject: `Welcome to Vision! Access Approved for ${institutionName}`,
        htmlContent,
        senderName: "Vision Onboarding"
    });
};

const sendPasswordResetEmail = async ({ to, name, institutionName, password }) => {
    const loginLink = process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:5173/login';
    
    const htmlContent = `
        <div style="padding: 24px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #f59e0b; margin: 0; font-size: 24px;">Security Update 🔒</h1>
                <p style="color: #6b7280; margin-top: 8px;">Your administrator password has been reset.</p>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px 0;">Hi <strong>${name}</strong>,</p>
                <p style="margin: 0; line-height: 1.6;">The Super Admin has recently updated or reset your login credentials for <strong>${institutionName}</strong>.</p>
            </div>

            <div style="padding: 20px; border: 1px dashed #f59e0b; border-radius: 12px; margin-bottom: 24px;">
                <h3 style="margin-top: 0; font-size: 14px; color: #d97706; text-transform: uppercase; letter-spacing: 0.05em;">Your New Credentials</h3>
                <p style="margin: 8px 0; font-size: 14px;">Login Email: <strong>${to}</strong></p>
                <p style="margin: 8px 0; font-size: 14px;">New Password: <strong style="color: #f59e0b;">${password}</strong></p>
            </div>

            <div style="text-align: center;">
                <a href="${loginLink}" style="display: inline-block; background-color: #f59e0b; color: #ffffff; padding: 14px 40px; border-radius: 12px; text-decoration: none; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.2);">Login Now</a>
            </div>

            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af; text-align: center;">
                <p>If you did not request this change, please contact platform support immediately.</p>
                <p>&copy; ${new Date().getFullYear()} Vision Exam Platform. Built for Excellence.</p>
            </div>
        </div>`;

    return await sendBrevoEmail({
        to,
        subject: `Security Alert: Password Reset for ${institutionName}`,
        htmlContent,
        senderName: "Vision Security"
    });
};

const sendVerificationEmail = async ({ to, name, otp }) => {
    const htmlContent = `
        <div style="padding: 24px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #10b981; margin: 0; font-size: 24px;">Verify Your Request 🚀</h1>
                <p style="color: #6b7280; margin-top: 8px;">Just one more step to join Vision.</p>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px 0;">Hi <strong>${name}</strong>,</p>
                <p style="margin: 0; line-height: 1.6;">We received a request to access the Vision Exam Platform for your institution. To ensure this request is valid, please use the verification code below.</p>
            </div>

            <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; background-color: #f3f4f6; color: #111827; padding: 16px 32px; border-radius: 12px; font-size: 32px; font-weight: bold; letter-spacing: 8px; border: 2px solid #e5e7eb;">
                    ${otp}
                </div>
            </div>

            <div style="padding: 16px; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; color: #92400e; text-align: center;">
                    <strong>Note:</strong> This code will expire in <strong>10 minutes</strong>.
                </p>
            </div>

            <div style="font-size: 13px; color: #6b7280; line-height: 1.5;">
                <p style="margin-bottom: 8px;">If you did not make this request, you can safely ignore this email. No institution will be created without verification.</p>
                <p>For support, contact us at <a href="mailto:support@vision.edu" style="color: #10b981; text-decoration: none;">support@vision.edu</a></p>
            </div>

            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af; text-align: center;">
                <p>&copy; ${new Date().getFullYear()} Vision Exam Platform. Built for Excellence.</p>
            </div>
        </div>`;

    return await sendBrevoEmail({
        to,
        subject: `${otp} is your Vision verification code`,
        htmlContent,
        senderName: "Vision Verification"
    });
};

const sendPasswordSetupEmail = async ({ to, name, institutionName, setupLink }) => {
    const htmlContent = `
        <div style="padding: 24px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #10b981; margin: 0; font-size: 24px;">Your Trial is Ready! 🎉</h1>
                <p style="color: #6b7280; margin-top: 8px;">Welcome to the Vision Exam Platform.</p>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px 0;">Hi <strong>${name}</strong>,</p>
                <p style="margin: 0; line-height: 1.6;">Congratulations! Your trial workspace for <strong>${institutionName}</strong> has been provisioned. To get started, please set your administrator password.</p>
            </div>

            <div style="text-align: center; margin-bottom: 24px;">
                <a href="${setupLink}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 14px 40px; border-radius: 12px; text-decoration: none; font-weight: bold; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);">Complete Your Setup</a>
            </div>

            <div style="padding: 16px; border: 1px dashed #10b981; border-radius: 12px; margin-bottom: 24px;">
                <h3 style="margin-top: 0; font-size: 14px; color: #059669; text-transform: uppercase; letter-spacing: 0.05em;">Trial Plan Details</h3>
                <p style="margin: 8px 0; font-size: 14px;">• Duration: <strong>7 Days</strong></p>
                <p style="margin: 8px 0; font-size: 14px;">• Student Limit: <strong>50</strong></p>
                <p style="margin: 8px 0; font-size: 14px;">• Exam Limit: <strong>2</strong></p>
            </div>

            <div style="font-size: 13px; color: #6b7280; line-height: 1.5; text-align: center;">
                <p>If you have any questions, our support team is here to help.</p>
                <p>&copy; ${new Date().getFullYear()} Vision Exam Platform. Built for Excellence.</p>
            </div>
        </div>`;

    return await sendBrevoEmail({
        to,
        subject: `Welcome to Vision! Complete Your Setup for ${institutionName}`,
        htmlContent,
        senderName: "Vision Onboarding"
    });
};

const sendTrialEndingEmail = async ({ to, name, daysLeft }) => {
    const htmlContent = `
        <div style="padding: 24px; font-family: sans-serif; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 16px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #92400e;">Action Required: Your Trial is Ending soon ⏳</h2>
            <p>Hi ${name}, your Vision trial for your institution will expire in <strong>${daysLeft} days</strong>. Upgrade now to keep your data and continue proctoring exams seamlessly.</p>
            <div style="text-align: center; margin-top: 24px;">
                <a href="${process.env.FRONTEND_URL}/billing" style="background-color: #d97706; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Upgrade Now</a>
            </div>
        </div>`;

    return await sendBrevoEmail({
        to,
        subject: `Your Vision Trial Expires in ${daysLeft} Days`,
        htmlContent,
        senderName: "Vision Billing"
    });
};

const sendPaymentFailedEmail = async ({ to, name, amount, reason }) => {
    const htmlContent = `
        <div style="padding: 24px; font-family: sans-serif; background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 16px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #b91c1c;">Payment Failed 🚨</h2>
            <p>Hi ${name}, we couldn't process your payment of <strong>₹${amount}</strong>.</p>
            <p style="color: #7f1d1d;">Reason: ${reason || 'Card declined or insufficient funds'}</p>
            <p>Please update your payment method to avoid service interruption.</p>
        </div>`;

    return await sendBrevoEmail({
        to,
        subject: `Urgent: Payment Failed for Vision Subscription`,
        htmlContent,
        senderName: "Vision Billing"
    });
};

const sendUpgradeSuccessEmail = async ({ to, name, planName }) => {
    const htmlContent = `
        <div style="padding: 24px; font-family: sans-serif; background-color: #f0fdf4; border: 1px solid #dcfce7; border-radius: 16px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #15803d;">Upgrade Successful! 🎉</h2>
            <p>Hi ${name}, your institution is now on the <strong>${planName}</strong> plan.</p>
            <p>All enterprise features and increased limits are now active.</p>
        </div>`;

    return await sendBrevoEmail({
        to,
        subject: `Welcome to ${planName}! Your Upgrade is Complete`,
        htmlContent,
        senderName: "Vision Billing"
    });
};

module.exports = {
    sendInviteEmail,
    sendSubscriptionNotification,
    sendDemoRequestNotification,
    sendAccessApprovedEmail,
    sendPasswordResetEmail,
    sendVerificationEmail,
    sendPasswordSetupEmail,
    sendTrialEndingEmail,
    sendPaymentFailedEmail,
    sendUpgradeSuccessEmail
};
