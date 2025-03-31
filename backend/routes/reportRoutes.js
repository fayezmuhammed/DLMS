const express = require('express');
const router = express.Router();
const { 
    getBorrowingTrends,
    getCategoryDistribution,
    getOverdueAnalysis,
    getPopularBooks
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

// All report routes are protected and require admin access
router.use(protect);
router.use(authorize('admin'));

// Report routes
router.get('/borrowing-trends', getBorrowingTrends);
router.get('/category-distribution', getCategoryDistribution);
router.get('/overdue-analysis', getOverdueAnalysis);
router.get('/popular-books', getPopularBooks);

module.exports = router; 