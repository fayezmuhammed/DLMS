const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect, admin } = require('../middleware/auth');

// Get all settings - Admin only
router.get('/', protect, admin, settingsController.getSettings);

// Borrowing rules - Public endpoint for client-side validation
router.get('/borrowing-rules', async (req, res) => {
    const settings = require('../utils/settings');
    try {
        const rules = await settings.getBorrowingRules();
        res.status(200).json({
            success: true,
            data: rules
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch borrowing rules',
            error: error.message
        });
    }
});

// Update routes - Admin only
router.put('/general', protect, admin, settingsController.updateGeneralSettings);
router.put('/borrowing-rules', protect, admin, settingsController.updateBorrowingRules);
router.put('/notifications', protect, admin, settingsController.updateNotificationSettings);
router.put('/email', protect, admin, settingsController.updateEmailSettings);

// Test email configuration
router.post('/test-email', protect, admin, settingsController.testEmailSettings);

// Trigger a due books check and email sending (manual trigger)
router.post('/send-reminders', protect, admin, async (req, res) => {
    try {
        const notifyUsers = require('../services/notifyUsers');
        const result = await notifyUsers.sendDueBookReminders();
        
        res.status(200).json({
            success: true,
            message: 'Due book reminders sent successfully',
            result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to send due book reminders',
            error: error.message
        });
    }
});

module.exports = router; 