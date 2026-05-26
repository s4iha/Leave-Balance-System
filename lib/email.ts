import nodemailer from 'nodemailer';

interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

interface OnboardingEmailOptions {
  name: string;
  email: string;
  temporaryPassword: string;
  appUrl: string;
}

/**
 * Reusable email service for the Leave Balance System.
 * Configured via SMTP environment variables.
 */
export async function sendEmail({ to, subject, text, html }: SendEmailOptions) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || '"UPHSM - Leave Balance System" <notifications@uphsm.system>';

  if (!host || !user || !pass) {
    console.error('[Email Service] Error: SMTP configuration is missing in environment variables.');
    return { success: false, error: 'SMTP configuration missing' };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html: html || wrapInDefaultTemplate(subject, text || ''),
    });

    console.log('[Email Service] Message sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email Service] Error sending email:', error);
    return { success: false, error };
  }
}

export function buildOnboardingEmail({
  name,
  email,
  temporaryPassword,
  appUrl,
}: OnboardingEmailOptions) {
  return {
    subject: 'Welcome to Leave Balance System - Your Account Details',
    html: `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #1e3a8a;">Welcome to the Team, ${name}!</h2>
        <p>Your account for the <strong>Leave Balance System</strong> has been created. You can now log in using the temporary credentials below:</p>
        <div style="background: #f7fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Login URL:</strong> <a href="${appUrl}/login">${appUrl}/login</a></p>
          <p style="margin: 5px 0;"><strong>Username/Email:</strong> ${email}</p>
          <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #edf2f7; padding: 2px 4px; border-radius: 4px;">${temporaryPassword}</code></p>
        </div>
        <p style="color: #e53e3e; font-weight: bold;">Security Notice: You will be required to change this password upon your first login.</p>
        <p>If you have any questions, please contact your HR department or system administrator.</p>
        <hr style="border: none; border-top: 1px solid #edf2f7; margin: 30px 0;" />
        <p style="font-size: 12px; color: #718096;">&copy; ${new Date().getFullYear()} Faculty Leave and Balance System</p>
      </div>
    `,
  };
}

/**
 * Wraps the email content in a professional HTML template.
 */
function wrapInDefaultTemplate(title: string, body: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; }
          .header { border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
          .footer { margin-top: 30px; font-size: 12px; color: #718096; border-top: 1px solid #edf2f7; padding-top: 15px; }
          .button { display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0; color: #1e3a8a;">Leave Balance System</h2>
          </div>
          <div class="content">
            <h3 style="color: #2d3748;">${title}</h3>
            <p style="white-space: pre-wrap;">${body}</p>
          </div>
          <div class="footer">
            <p>This is an automated notification from the Leave Balance System. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} Faculty Leave and Balance System</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
