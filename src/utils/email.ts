import nodemailer from 'nodemailer';
import { config } from '../config';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass
  }
});

// Verify connection configuration on startup
transporter.verify()
  .then(() => console.log('SMTP Server is ready to send emails'))
  .catch((error) => console.error('SMTP Connection Error:', error));

export const sendResetCode = async (
  email: string,
  code: string
): Promise<void> => {
  const mailOptions = {
    from: `"Storage Management System" <${config.smtp.user}>`,
    to: email,
    subject: 'Password Reset Code - Storage Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Reset Your Password</h2>
        <p>We received a request to reset your password. Use the following code to proceed:</p>
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; margin: 20px 0;">
          <h1 style="color: #dc3545; letter-spacing: 5px; margin: 0;">${code}</h1>
        </div>
        <p>This code will expire in 30 minutes.</p>
        <p>If you didn't request this password reset, please ignore this email or contact support.</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          This is an automated message, please do not reply to this email.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending reset code:', error);
    throw new Error('Failed to send reset code email');
  }
};