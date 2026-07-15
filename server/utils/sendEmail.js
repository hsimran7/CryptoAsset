import nodemailer from 'nodemailer';

/**
 * Utility to send emails via SMTP, with a console fallback for local testing
 * @param {Object} options - Email sending options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Text email body
 * @param {string} options.html - HTML email body
 */
export const sendEmail = async (options) => {
  const isSmtpConfigured =
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS;

  if (!isSmtpConfigured) {
    console.log('\n=================== [DEVELOPMENT EMAIL FALLBACK] ===================');
    console.log(`TO:       ${options.email}`);
    console.log(`SUBJECT:  ${options.subject}`);
    console.log('-------------------------------------------------------------------');
    console.log(options.message);
    console.log('====================================================================\n');
    return { success: true, loggedToConsole: true };
  }

  try {
    // Create reusable transporter object using SMTP transport
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '2525', 10),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'CryptoVision'}" <${process.env.FROM_EMAIL || 'noreply@cryptovision.ai'}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Message sent successfully: ${info.messageId}`);
    return { success: true, info };
  } catch (error) {
    console.error(`[Email Service Error] Failed to send email via SMTP: ${error.message}`);
    throw error;
  }
};
