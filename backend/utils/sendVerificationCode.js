const sendEmail = require('./sendEmail');
const { generateVerificationOtpEmailTemplate } = require('./emailTemplates');

/**
 * Send verification code to user's email
 * @param {object} user - User object with email property
 * @param {string} verificationCode - The verification code to send
 * @returns {Promise} - Result from email sending
 */
const sendVerificationCode = async (user, verificationCode) => {
  try {
    const emailHtml = generateVerificationOtpEmailTemplate(verificationCode);
    
    // Send email with verification code
    const result = await sendEmail({
      email: user.email,
      subject: 'Email Verification - Digital Library Management System',
      html: emailHtml
    });
    
    return result;
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw error;
  }
};

module.exports = sendVerificationCode; 