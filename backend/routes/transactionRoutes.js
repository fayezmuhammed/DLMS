const express = require('express');
const router = express.Router();
const { 
    borrowBook, 
    returnBook, 
    getBorrowingHistory,
    getAllTransactions,
    getActiveTransactions,
    getOverdueTransactions
} = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/auth');

// Public routes - none

// User routes - protected
router.post('/borrow/:bookId', protect, borrowBook);
router.post('/return/:bookId', protect, returnBook);
router.get('/history', protect, getBorrowingHistory);

// Admin routes - protected and authorized
router.get('/', protect, authorize('admin'), getAllTransactions);
router.get('/active', protect, authorize('admin'), getActiveTransactions);
router.get('/overdue', protect, authorize('admin'), getOverdueTransactions);

module.exports = router; 