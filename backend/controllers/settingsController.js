const Settings = require('../models/Settings');
const settings = require('../utils/settings');
const logger = require('../utils/logger');

/**
 * Get all system settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSettings = async (req, res) => {
    try {
        const systemSettings = await Settings.getSettings();
        
        // Remove sensitive information
        const sanitizedSettings = systemSettings.toObject();
        if (sanitizedSettings.emailServer) {
            sanitizedSettings.emailServer.password = undefined;
        }
        
        res.status(200).json({
            success: true,
            data: sanitizedSettings
        });
    } catch (error) {
        logger.error('Error fetching settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch settings',
            error: error.message
        });
    }
};

/**
 * Update general settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateGeneralSettings = async (req, res) => {
    try {
        const { libraryName, email, phone, address } = req.body;
        
        // Validate required fields
        if (!libraryName) {
            return res.status(400).json({
                success: false,
                message: 'Library name is required'
            });
        }
        
        const systemSettings = await Settings.getSettings();
        
        // Update general settings
        systemSettings.libraryName = libraryName;
        systemSettings.email = email;
        systemSettings.phone = phone;
        systemSettings.address = address;
        systemSettings.updatedAt = Date.now();
        
        await systemSettings.save();
        
        res.status(200).json({
            success: true,
            message: 'General settings updated successfully',
            data: systemSettings
        });
    } catch (error) {
        logger.error('Error updating general settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update general settings',
            error: error.message
        });
    }
};

/**
 * Update borrowing rules
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateBorrowingRules = async (req, res) => {
    try {
        const { 
            maxBooksStudent, 
            maxBooksTeacher, 
            maxDaysStudent, 
            maxDaysTeacher, 
            finePerDay 
        } = req.body;
        
        // Validate inputs
        if (!maxBooksStudent || !maxBooksTeacher || !maxDaysStudent || !maxDaysTeacher || finePerDay === undefined) {
            return res.status(400).json({
                success: false,
                message: 'All borrowing rule fields are required'
            });
        }
        
        const systemSettings = await Settings.getSettings();
        
        // Update borrowing rules
        systemSettings.maxBooksStudent = maxBooksStudent;
        systemSettings.maxBooksTeacher = maxBooksTeacher;
        systemSettings.maxDaysStudent = maxDaysStudent;
        systemSettings.maxDaysTeacher = maxDaysTeacher;
        systemSettings.finePerDay = finePerDay;
        systemSettings.updatedAt = Date.now();
        
        await systemSettings.save();
        
        res.status(200).json({
            success: true,
            message: 'Borrowing rules updated successfully',
            data: systemSettings
        });
    } catch (error) {
        logger.error('Error updating borrowing rules:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update borrowing rules',
            error: error.message
        });
    }
};

/**
 * Update notification settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateNotificationSettings = async (req, res) => {
    try {
        const { 
            emailNotifications, 
            dueDateReminders, 
            overdueNotifications, 
            newBookNotifications 
        } = req.body;
        
        const systemSettings = await Settings.getSettings();
        
        // Update notification settings
        if (emailNotifications !== undefined) systemSettings.emailNotifications = emailNotifications;
        if (dueDateReminders !== undefined) systemSettings.dueDateReminders = dueDateReminders;
        if (overdueNotifications !== undefined) systemSettings.overdueNotifications = overdueNotifications;
        if (newBookNotifications !== undefined) systemSettings.newBookNotifications = newBookNotifications;
        systemSettings.updatedAt = Date.now();
        
        await systemSettings.save();
        
        res.status(200).json({
            success: true,
            message: 'Notification settings updated successfully',
            data: systemSettings
        });
    } catch (error) {
        logger.error('Error updating notification settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update notification settings',
            error: error.message
        });
    }
};

/**
 * Update email server settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateEmailSettings = async (req, res) => {
    try {
        const { 
            host, 
            port, 
            secure, 
            username, 
            password, 
            fromAddress, 
            fromName,
            emailNotifications,
            dueDateReminders,
            overdueNotifications
        } = req.body;
        
        // Basic validation
        if (!host || !port || !username || !fromAddress) {
            return res.status(400).json({
                success: false,
                message: 'Host, port, username, and from address are required'
            });
        }
        
        // Update settings using the settings utility
        const result = await settings.updateEmailSettings({
            host,
            port,
            secure,
            username,
            password,
            fromAddress,
            fromName,
            enabled: emailNotifications,
            dueDateReminders,
            overdueNotifications
        });
        
        if (result.success) {
            res.status(200).json({
                success: true,
                message: 'Email settings updated successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                message: result.message,
                error: result.error
            });
        }
    } catch (error) {
        logger.error('Error updating email settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update email settings',
            error: error.message
        });
    }
};

/**
 * Test email settings by sending a test email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.testEmailSettings = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email address is required for testing'
            });
        }
        
        // Import the notifyUsers service
        const notifyUsers = require('../services/notifyUsers');
        
        // Configure and create a transporter
        const nodemailer = require('nodemailer');
        const emailSettings = await settings.getEmailSettings();
        
        // Ensure email settings are configured
        if (!emailSettings || !emailSettings.host || !emailSettings.port || !emailSettings.username) {
            return res.status(400).json({
                success: false,
                message: 'Email settings are not properly configured'
            });
        }
        
        const transporter = nodemailer.createTransport({
            host: emailSettings.host,
            port: emailSettings.port,
            secure: emailSettings.secure,
            auth: {
                user: emailSettings.username,
                pass: emailSettings.password
            }
        });
        
        // Send test email
        const info = await transporter.sendMail({
            from: `"${emailSettings.fromName}" <${emailSettings.fromAddress}>`,
            to: email,
            subject: 'Test Email from Library Management System',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
                        <h2 style="margin: 0;">Library Management System</h2>
                    </div>
                    
                    <div style="padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
                        <p>This is a test email from your Library Management System.</p>
                        <p>If you received this email, your email settings are configured correctly.</p>
                        <p>You can now use the email notification features.</p>
                    </div>
                    
                    <div style="background-color: #f3f4f6; padding: 10px; text-align: center; font-size: 12px; color: #6b7280;">
                        <p>This is an automated test email. Please do not reply to this message.</p>
                    </div>
                </div>
            `
        });
        
        logger.info('Test email sent:', { messageId: info.messageId });
        
        res.status(200).json({
            success: true,
            message: 'Test email sent successfully',
            messageId: info.messageId
        });
    } catch (error) {
        logger.error('Error sending test email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test email',
            error: error.message
        });
    }
}; 