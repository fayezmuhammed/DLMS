/**
 * Generate HTML email template for verification code
 * @param {string} verificationCode - 6-digit verification code
 * @returns {string} - HTML template for verification email
 */
const generateVerificationOtpEmailTemplate = (verificationCode) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Email Verification</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
        }
        .container {
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 20px;
          margin: 20px auto;
        }
        .header {
          background-color: #3b82f6;
          color: white;
          padding: 10px 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
          margin: -20px -20px 20px;
        }
        .code {
          font-size: 28px;
          font-weight: bold;
          text-align: center;
          letter-spacing: 5px;
          color: #3b82f6;
          padding: 10px;
          border: 1px dashed #ccc;
          background-color: #f9fafb;
          margin: 20px 0;
        }
        .footer {
          font-size: 12px;
          color: #666;
          text-align: center;
          margin-top: 30px;
          border-top: 1px solid #eee;
          padding-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Digital Library Management System</h2>
        </div>
        <h3>Email Verification</h3>
        <p>Thank you for registering with our Digital Library Management System. To complete your registration, please verify your email address using the verification code below:</p>
        
        <div class="code">${verificationCode}</div>
        
        <p>This code will expire in 15 minutes for security reasons.</p>
        <p>If you did not request this verification code, please ignore this email.</p>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Digital Library Management System. All rights reserved.</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate HTML email template for password reset
 * @param {string} resetPasswordUrl - URL for password reset
 * @returns {string} - HTML template for password reset email
 */
const generateForgotPasswordEmailTemplate = (resetPasswordUrl) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
        }
        .container {
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 20px;
          margin: 20px auto;
        }
        .header {
          background-color: #3b82f6;
          color: white;
          padding: 10px 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
          margin: -20px -20px 20px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #3b82f6;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-weight: bold;
          margin: 20px 0;
        }
        .reset-link {
          word-break: break-all;
          color: #3b82f6;
          margin: 20px 0;
        }
        .footer {
          font-size: 12px;
          color: #666;
          text-align: center;
          margin-top: 30px;
          border-top: 1px solid #eee;
          padding-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Digital Library Management System</h2>
        </div>
        <h3>Password Reset Request</h3>
        <p>You are receiving this email because you (or someone else) has requested the reset of your account password.</p>
        
        <div style="text-align: center;">
          <a href="${resetPasswordUrl}" class="button">Reset Password</a>
        </div>
        
        <p>If the button above doesn't work, you can also copy and paste the following link into your browser:</p>
        <div class="reset-link">${resetPasswordUrl}</div>
        
        <p>This password reset link will expire in 10 minutes for security reasons.</p>
        <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Digital Library Management System. All rights reserved.</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  generateVerificationOtpEmailTemplate,
  generateForgotPasswordEmailTemplate
}; 