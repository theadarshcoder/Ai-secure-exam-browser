// ═══════════════════════════════════════════════════════════
//  📧 Email Service — Nodemailer (Gmail SMTP)
//  Practical setup for testing without a custom domain.
// ═══════════════════════════════════════════════════════════

const nodemailer = require('nodemailer');

// Set up transporter with Gmail credentials from .env
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Send an exam invite email to a student.
 * 
 * @param {Object} params
 * @param {string} params.to - Student email
 * @param {string} params.studentName - Student's name
 * @param {string} params.password - Generated password (plain text)
 * @param {string} params.examName - Exam title
 * @param {string} params.verifyLink - Full verify URL with token
 * @param {string} params.expiresAt - Token expiry date string
 * @returns {Object} Success or failure status
 */
const sendInviteEmail = async ({ to, studentName, password, examName, verifyLink, expiresAt }) => {
    const expiryDate = new Date(expiresAt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata'
    });

    // Minimal HTML Template
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
        <tr>
            <td align="center">
                <table width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#10b981,#059669);padding:28px 32px;text-align:center;">
                            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
                                Vision Exam Platform
                            </h1>
                            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">
                                Secure Assessment Invitation
                            </p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:28px 32px;">
                            <p style="margin:0 0 16px;color:#27272a;font-size:15px;line-height:1.6;">
                                Hi <strong>${studentName}</strong>,
                            </p>
                            <p style="margin:0 0 20px;color:#3f3f46;font-size:14px;line-height:1.6;">
                                You have been invited to take the following exam:
                            </p>

                            <!-- Exam Info Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin-bottom:20px;">
                                <tr>
                                    <td style="padding:16px 20px;">
                                        <p style="margin:0 0 4px;color:#15803d;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Exam</p>
                                        <p style="margin:0;color:#166534;font-size:16px;font-weight:700;">${examName}</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Credentials Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa;border:1px solid #e4e4e7;border-radius:8px;margin-bottom:24px;">
                                <tr>
                                    <td style="padding:16px 20px;">
                                        <p style="margin:0 0 10px;color:#71717a;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Your Credentials</p>
                                        <table cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="color:#52525b;font-size:13px;padding:3px 0;width:80px;">Email:</td>
                                                <td style="color:#18181b;font-size:13px;font-weight:600;padding:3px 0;">${to}</td>
                                            </tr>
                                            <tr>
                                                <td style="color:#52525b;font-size:13px;padding:3px 0;width:80px;">Password:</td>
                                                <td style="color:#18181b;font-size:13px;font-weight:600;font-family:monospace;padding:3px 0;">${password}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Security Warning Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff7ed;border:1px solid #ffedd5;border-radius:8px;margin-bottom:24px;">
                                <tr>
                                    <td style="padding:12px 16px;">
                                        <p style="margin:0;color:#9a3412;font-size:12px;font-weight:700;line-height:1.4;">
                                            🔒 SECURE BROWSER REQUIRED:
                                        </p>
                                        <p style="margin:4px 0 12px;color:#c2410c;font-size:12px;line-height:1.4;">
                                            This exam can ONLY be taken using the <b>VISION Secure Browser</b>. You can download it below or from your dashboard.
                                        </p>
                                        <a href="https://github.com/codervinitjangir/Ai-secure-exam-browser/releases/download/v1.0.0/VISION_Secure_Setup.exe" style="display:inline-block;padding:8px 16px;background-color:#c2410c;color:#ffffff;text-decoration:none;border-radius:6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Download Browser</a>
                                    </td>
                                </tr>
                            </table>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding:4px 0 20px;">
                                        <a href="${verifyLink}" 
                                           style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:14px;font-weight:700;letter-spacing:0.3px;">
                                            Start Your Exam
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Fallback Link -->
                            <p style="margin:0 0 16px;color:#71717a;font-size:12px;line-height:1.5;text-align:center;">
                                Button not working? Copy and paste this link in your browser:<br>
                                <a href="${verifyLink}" style="color:#10b981;word-break:break-all;font-size:11px;">${verifyLink}</a>
                            </p>

                            <!-- Expiry Warning -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef3c7;border:1px solid #fde68a;border-radius:8px;">
                                <tr>
                                    <td style="padding:12px 16px;">
                                        <p style="margin:0;color:#92400e;font-size:12px;line-height:1.5;">
                                            <strong>Note:</strong> This invitation link expires on <strong>${expiryDate}</strong>. Please complete your exam before the deadline.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding:16px 32px 24px;border-top:1px solid #f4f4f5;text-align:center;">
                            <p style="margin:0;color:#a1a1aa;font-size:11px;line-height:1.5;">
                                This is an automated message from Vision Exam Platform.<br>
                                Do not share your credentials with anyone.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

    // Plain Text Fallback
    const text = `Hi ${studentName},

You have been invited to take the exam: ${examName}

Your Credentials:
  Email: ${to}
  Password: ${password}

Start your exam here: ${verifyLink}

This link expires on: ${expiryDate}

Do not share your credentials with anyone.

— Vision Exam Platform`;

    try {
        const info = await transporter.sendMail({
            from: '"Vision Exam Platform" <' + process.env.EMAIL_USER + '>',
            to: to,
            subject: `You're Invited: ${examName} — Vision Exam Platform`,
            html,
            text
        });

        console.log(`📧 [Email] Sent to ${to} | MessageId: ${info.messageId}`);
        return { success: true, id: info.messageId };
    } catch (error) {
        console.error(`❌ [Email] Failed to send to ${to}:`, error.message);
        return { success: false, error: error.message };
    }
};

module.exports = { sendInviteEmail };
