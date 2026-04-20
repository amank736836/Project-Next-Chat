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

export async function sendForgotPasswordEmail(email, code, name) {
  const subject = 'Forgot Password';
  const message = `Dear ${name},\n\nYour verification code is: ${code}\n\nPlease use this code to reset your password.`;

  try {
    await transporter.sendMail({
      from: process.env.NODE_MAILER_EMAIL,
      to: email,
      subject,
      text: message,
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function sendVerificationEmail(email, code, name) {
  const subject = 'Email Verification';
  const message = `Dear ${name},\n\nYour verification code is: ${code}\n\nPlease use this code to verify your email address.`;

  try {
    await transporter.sendMail({
      from: process.env.NODE_MAILER_EMAIL,
      to: email,
      subject,
      text: message,
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
