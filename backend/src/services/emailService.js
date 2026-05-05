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

module.exports = {
    sendInviteEmail,
    sendSubscriptionNotification
};
