// ═══════════════════════════════════════════════════════════
//  📧 Email Service — Brevo (HTTP API)
//  Bypasses Render's SMTP Port Blocks for 100% Reliability
// ═══════════════════════════════════════════════════════════

const Brevo = require('@getbrevo/brevo');

/**
 * 🛡️ Helper to initialize Brevo API Instance with fresh environment variables.
 */
const getApiInstance = () => {
    if (!process.env.BREVO_API_KEY) {
        throw new Error('BREVO_API_KEY is missing! Please add it to your environment variables.');
    }
    
    let defaultClient = Brevo.ApiClient.instance;
    let apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    return new Brevo.TransactionalEmailsApi();
};

/**
 * Send an exam invite email to a student using Brevo HTTP API.
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
<head>
    <meta charset="utf-8">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
        <tr>
            <td align="center">
                <table width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="background:linear-gradient(135deg,#10b981,#059669);padding:28px 32px;text-align:center;">
                            <h1 style="margin:0;color:#ffffff;font-size:22px;">Vision Exam Platform</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:28px 32px;">
                            <p style="color:#27272a;font-size:15px;">Hi <strong>${studentName}</strong>,</p>
                            <p style="color:#3f3f46;font-size:14px;">You have been invited to take the following exam:</p>
                            <div style="background-color:#f0fdf4;padding:16px;border-radius:8px;margin-bottom:20px;">
                                <p style="margin:0;color:#166534;font-size:16px;font-weight:700;">${examName}</p>
                            </div>
                            <div style="background-color:#fafafa;padding:16px;border-radius:8px;margin-bottom:24px;">
                                <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#71717a;">CREDENTIALS</p>
                                <p style="margin:0;font-size:13px;">Email: <strong>${to}</strong></p>
                                <p style="margin:0;font-size:13px;">Password: <strong>${password}</strong></p>
                            </div>
                            <div style="text-align:center;padding:10px 0;">
                                <a href="${verifyLink}" style="background-color:#10b981;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;">Start Your Exam</a>
                            </div>
                            <p style="font-size:12px;color:#92400e;background-color:#fef3c7;padding:12px;border-radius:8px;margin-top:24px;">
                                <strong>Note:</strong> Expires on <strong>${expiryDate}</strong>.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    try {
        const apiInstance = getApiInstance();
        const sendSmtpEmail = new Brevo.SendSmtpEmail();

        sendSmtpEmail.subject = `You're Invited: ${examName} — Vision`;
        sendSmtpEmail.htmlContent = htmlContent;
        sendSmtpEmail.sender = { name: "Vision Exam Platform", email: process.env.EMAIL_USER };
        sendSmtpEmail.to = [{ email: to, name: studentName }];
        sendSmtpEmail.replyTo = { email: process.env.EMAIL_USER };

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('📧 [Brevo SUCCESS]:', { to, messageId: data.messageId });
        return { success: true, id: data.messageId };
    } catch (error) {
        console.error('❌ [Brevo FAILED]:', error.message);
        return { success: false, error: error.message };
    }
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

    try {
        const apiInstance = getApiInstance();
        const sendSmtpEmail = new Brevo.SendSmtpEmail();

        sendSmtpEmail.subject = `New Contact from ${email}`;
        sendSmtpEmail.htmlContent = htmlContent;
        sendSmtpEmail.sender = { name: "Vision Alerts", email: process.env.EMAIL_USER };
        sendSmtpEmail.to = [{ email: adminEmail }];

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        return { success: true, id: data.messageId };
    } catch (error) {
        console.error(`❌ [Brevo Admin Alert Failed]:`, error.message);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendInviteEmail,
    sendSubscriptionNotification
};
