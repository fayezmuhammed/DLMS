const express = require('express');
const router = express.Router();
const { 
  getSettings, 
  updateSettings, 
  getBorrowingRules 
} = require('../controllers/settingsController');
const { protect, admin } = require('../middleware/auth');

// Admin-only routes
router.get('/', protect, admin, getSettings);
router.put('/', protect, admin, updateSettings);

// Public routes
router.get('/borrowing-rules', getBorrowingRules);

module.exports = router; 