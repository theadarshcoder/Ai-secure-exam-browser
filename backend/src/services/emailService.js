// ═══════════════════════════════════════════════════════════
//  📧 Email Service — Brevo (HTTP API via Axios)
//  Bypasses Render's SMTP Port Blocks for 100% Reliability
// ═══════════════════════════════════════════════════════════

const axios = require('axios');

/**
 * Send an email using Brevo HTTP API.
 */
const sendBrevoEmail = async ({ to, subject, htmlContent, senderName }) => {
    if (!process.env.BREVO_API_KEY) {
        throw new Error('BREVO_API_KEY is missing! Please add it to your environment variables.');
    }

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

        console.log(`📧 [Brevo SUCCESS]: Sent to ${to} | MessageId: ${response.data.messageId}`);
        return { success: true, id: response.data.messageId };
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        console.error('❌ [Brevo FAILED]:', errorMsg);
        return { success: false, error: errorMsg };
    }
};

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

module.exports = {
    sendInviteEmail,
    sendSubscriptionNotification,
    sendDemoRequestNotification,
    sendAccessApprovedEmail
};
