import nodemailer from 'nodemailer';
import { config } from './config.js';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  
  if (!config.smtpUser || !config.smtpPass) {
    console.warn('⚠️ SMTP credentials (SMTP_USER, SMTP_PASS) are not configured. Emails will not be sent.');
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });

  return transporter;
};

export const sendWelcomeEmail = async (email, name, plainPassword, role = 'Admin', companyName = 'VanniLoan') => {
  const mailer = getTransporter();
  if (!mailer) {
    console.log(`[Email Mock] Would send welcome email to ${email} (Password: ${plainPassword})`);
    return false;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background-color: #10b981; padding: 30px 40px; text-align: center; }
        .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; }
        .content { padding: 40px; }
        .content h2 { font-size: 20px; margin-top: 0; margin-bottom: 20px; color: #0f172a; }
        .content p { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .credentials { background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 4px; margin-bottom: 30px; }
        .credentials div { margin-bottom: 12px; }
        .credentials div:last-child { margin-bottom: 0; }
        .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; display: block; margin-bottom: 4px; }
        .value { font-size: 16px; font-weight: 700; color: #0f172a; font-family: monospace; }
        .button-container { text-align: center; margin-top: 30px; }
        .button { display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 15px; transition: background-color 0.2s; }
        .button:hover { background-color: #059669; }
        .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 40px; text-align: center; }
        .footer p { margin: 0; font-size: 13px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ${companyName}</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>Your ${role} account has been successfully created. You can now log in to the ${companyName} dashboard to manage operations.</p>
          
          <div class="credentials">
            <div>
              <span class="label">Username (Email)</span>
              <span class="value">${email}</span>
            </div>
            <div>
              <span class="label">Temporary Password</span>
              <span class="value">${plainPassword}</span>
            </div>
          </div>
          
          <p>For security reasons, we strongly recommend that you change your password immediately after logging in for the first time.</p>
          
          <div class="button-container">
            <a href="${config.corsOrigin}" class="button">Log In to Dashboard</a>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated message from the ${companyName} system. Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await mailer.sendMail({
      from: `"${companyName}" <${config.smtpUser}>`,
      to: email,
      subject: `Welcome to ${companyName} - Your Account Credentials`,
      html: htmlContent,
    });
    console.log(`✅ Welcome email sent to ${email}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${email}:`, error);
    return false;
  }
};
