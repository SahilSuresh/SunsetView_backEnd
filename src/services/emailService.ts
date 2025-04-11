import nodemailer from 'nodemailer';

// Configure mail transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Password reset template
export const sendPasswordResetEmail = async (
  to: string, 
  token: string, 
  firstName: string
) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: `"SunsetView.com" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Reset your password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #f97316, #f59e0b); padding: 20px; text-align: center; color: white;">
          <h1>SunsetView.com</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e5e5; border-top: none;">
          <h2>Hello ${firstName},</h2>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(to right, #f97316, #f59e0b); color: white; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-bold;">Reset Password</a>
          </div>
          <p>If you did not request a password reset, you can safely ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
          <p>If the button doesn't work, copy and paste this URL into your browser:</p>
          <p style="word-break: break-all; font-size: 14px; color: #666;">${resetUrl}</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>&copy; 2025 SunsetView.com. All rights reserved.</p>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};