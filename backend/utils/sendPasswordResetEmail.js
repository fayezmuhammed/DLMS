const sendEmail = require('./sendEmail');
const { generateForgotPasswordEmailTemplate } = require('./emailTemplates');

/**
 * Send password reset email with reset URL
 * @param {object} user - User object with email property
 * @param {string} resetUrl - The password reset URL
 * @returns {Promise} - Result from email sending
 */
const sendPasswordResetEmail = async (user, resetUrl) => {
  try {
    const emailHtml = generateForgotPasswordEmailTemplate(resetUrl);
    
    // Send email with reset password link
    const result = await sendEmail({
      email: user.email,
      subject: 'Password Reset - Digital Library Management System',
      html: emailHtml
    });
    
    return result;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

module.exports = sendPasswordResetEmail; 