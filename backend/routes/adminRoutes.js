const express = require('express');
const router = express.Router();
const { 
    getDashboardStats,
    getTopUsers,
    getRecentBooks,
    getRecentEBooks
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Admin-specific routes
router.get('/dashboard', protect, authorize('admin'), getDashboardStats);
router.get('/top-users', protect, authorize('admin'), getTopUsers);
router.get('/recent-books', protect, authorize('admin'), getRecentBooks);
router.get('/recent-ebooks', protect, authorize('admin'), getRecentEBooks);

module.exports = router; 