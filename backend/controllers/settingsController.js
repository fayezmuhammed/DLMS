const Settings = require('../models/Settings');

// @desc    Get settings
// @route   GET /api/settings
// @access  Private/Admin
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private/Admin
exports.updateSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    // Update settings with request body
    Object.keys(req.body).forEach(key => {
      if (settings[key] !== undefined) {
        settings[key] = req.body[key];
      }
    });
    
    settings.updatedAt = Date.now();
    await settings.save();
    
    res.status(200).json({
      success: true,
      data: settings,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get borrowing rules only
// @route   GET /api/settings/borrowing-rules
// @access  Public
exports.getBorrowingRules = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    // Extract only borrowing rule related fields
    const borrowingRules = {
      maxBooksStudent: settings.maxBooksStudent,
      maxBooksTeacher: settings.maxBooksTeacher,
      maxDaysStudent: settings.maxDaysStudent,
      maxDaysTeacher: settings.maxDaysTeacher,
      finePerDay: settings.finePerDay
    };
    
    res.status(200).json({
      success: true,
      data: borrowingRules
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
}; 