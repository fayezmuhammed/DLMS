const Settings = require('../models/Settings');
const logger = require('./logger');

/**
 * Get system-wide borrowing rules
 * @returns {Promise<Object>} Borrowing rules object
 */
exports.getBorrowingRules = async () => {
  try {
    const settings = await Settings.getSettings();
    
    return {
      maxBooksStudent: settings.maxBooksStudent,
      maxBooksTeacher: settings.maxBooksTeacher,
      maxDaysStudent: settings.maxDaysStudent,
      maxDaysTeacher: settings.maxDaysTeacher,
      finePerDay: settings.finePerDay
    };
  } catch (error) {
    logger.error('Error fetching borrowing rules:', error);
    
    // Return default values if settings can't be fetched
    return {
      maxBooksStudent: 3,
      maxBooksTeacher: 5,
      maxDaysStudent: 14,
      maxDaysTeacher: 30,
      finePerDay: 0.5
    };
  }
};

/**
 * Get email settings for the system
 * @returns {Promise<Object>} Email settings object
 */
exports.getEmailSettings = async () => {
  try {
    const settings = await Settings.getSettings();
    
    // Check if email settings exist
    if (!settings.emailServer) {
      // Create default email settings if they don't exist
      settings.emailServer = {
        host: process.env.EMAIL_HOST || '',
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        username: process.env.EMAIL_USERNAME || '',
        password: process.env.EMAIL_PASSWORD || '',
        fromAddress: process.env.EMAIL_FROM || 'library@example.com',
        fromName: process.env.EMAIL_NAME || 'Library Management System'
      };
      
      await settings.save();
    }
    
    return {
      host: settings.emailServer.host,
      port: settings.emailServer.port,
      secure: settings.emailServer.secure,
      username: settings.emailServer.username,
      password: settings.emailServer.password,
      fromAddress: settings.emailServer.fromAddress,
      fromName: settings.emailServer.fromName,
      enabled: settings.emailNotifications,
      dueDateReminders: settings.dueDateReminders,
      overdueNotifications: settings.overdueNotifications,
      finePerDay: settings.finePerDay
    };
  } catch (error) {
    logger.error('Error fetching email settings:', error);
    
    // Return default or environment values if settings can't be fetched
    return {
      host: process.env.EMAIL_HOST || '',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      username: process.env.EMAIL_USERNAME || '',
      password: process.env.EMAIL_PASSWORD || '',
      fromAddress: process.env.EMAIL_FROM || 'library@example.com',
      fromName: process.env.EMAIL_NAME || 'Library Management System',
      enabled: true,
      dueDateReminders: true,
      overdueNotifications: true,
      finePerDay: 0.5
    };
  }
};

/**
 * Update email settings
 * @param {Object} emailSettings - New email settings
 * @returns {Promise<Object>} Updated settings
 */
exports.updateEmailSettings = async (emailSettings) => {
  try {
    const settings = await Settings.getSettings();
    
    // Update email server settings
    settings.emailServer = {
      host: emailSettings.host,
      port: emailSettings.port,
      secure: emailSettings.secure,
      username: emailSettings.username,
      password: emailSettings.password,
      fromAddress: emailSettings.fromAddress,
      fromName: emailSettings.fromName
    };
    
    // Update notification preferences
    settings.emailNotifications = emailSettings.enabled;
    settings.dueDateReminders = emailSettings.dueDateReminders;
    settings.overdueNotifications = emailSettings.overdueNotifications;
    
    // Save and return the updated settings
    await settings.save();
    
    return {
      success: true,
      message: 'Email settings updated successfully'
    };
  } catch (error) {
    logger.error('Error updating email settings:', error);
    return {
      success: false,
      message: 'Failed to update email settings',
      error: error.message
    };
  }
}; 