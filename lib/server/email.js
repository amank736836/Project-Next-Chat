import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.NODE_MAILER_EMAIL,
    pass: process.env.NODE_MAILER_PASSWORD,
  },
});

const getSafeBaseUrl = (baseUrl) =>
  (baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

export async function sendForgotPasswordEmail({ email, code, name, identifier, baseUrl }) {
  const appBaseUrl = getSafeBaseUrl(baseUrl);
  const resolvedIdentifier = identifier || email;
  const resetLink = `${appBaseUrl}/forgot?identifier=${encodeURIComponent(
    resolvedIdentifier
  )}&verifyCode=${encodeURIComponent(code)}`;
  const subject = 'Forgot Password';
  const message = `Dear ${name},\n\nYour verification code is: ${code}\n\nUse this link to reset your password:\n${resetLink}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
      <h2 style="margin: 0 0 12px;">Forgot Password</h2>
      <p>Dear ${name},</p>
      <p>Your verification code is:</p>
      <p style="font-size: 22px; font-weight: 700; letter-spacing: 2px;">${code}</p>
      <p>You can reset your password directly from this link:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.NODE_MAILER_EMAIL,
      to: email,
      subject,
      text: message,
      html,
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function sendVerificationEmail({ email, code, name, identifier, baseUrl }) {
  const appBaseUrl = getSafeBaseUrl(baseUrl);
  const resolvedIdentifier = identifier || email;
  const verifyLink = `${appBaseUrl}/verify?identifier=${encodeURIComponent(
    resolvedIdentifier
  )}&verifyCode=${encodeURIComponent(code)}`;
  const subject = 'Email Verification';
  const message = `Dear ${name},\n\nYour verification code is: ${code}\n\nUse this link to verify your email:\n${verifyLink}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
      <h2 style="margin: 0 0 12px;">Email Verification</h2>
      <p>Dear ${name},</p>
      <p>Your verification code is:</p>
      <p style="font-size: 22px; font-weight: 700; letter-spacing: 2px;">${code}</p>
      <p>You can verify your email directly from this link:</p>
      <p><a href="${verifyLink}">${verifyLink}</a></p>
      <p>If this was not you, you can ignore this email.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.NODE_MAILER_EMAIL,
      to: email,
      subject,
      text: message,
      html,
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
