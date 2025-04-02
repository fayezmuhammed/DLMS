const express = require('express');
const router = express.Router();
const { 
    borrowBook, 
    returnBook, 
    getBorrowingHistory,
    getAllTransactions,
    getActiveTransactions,
    getOverdueTransactions,
    getStudentDues,
    getBookTransactions,
    issueBook,
    getUserActiveTransactions,
    getUserTransactionHistory
} = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/auth');

// Public routes - none

// User routes - protected
router.post('/borrow/:bookId', protect, borrowBook);
router.post('/return/:bookId', protect, returnBook);
router.get('/history', protect, getBorrowingHistory);

// Admin routes - protected and require admin role
router.get('/', protect, authorize('admin'), getAllTransactions);
router.get('/active', protect, authorize('admin'), getActiveTransactions);
router.get('/overdue', protect, authorize('admin'), getOverdueTransactions);
router.get('/student-dues/:userId', protect, authorize('admin'), getStudentDues);
router.get('/book/:bookId', protect, authorize('admin'), getBookTransactions);
router.post('/issue', protect, authorize('admin'), issueBook);

// User-specific transaction endpoints (admin only)
router.get('/user/:userId/active', protect, authorize('admin'), getUserActiveTransactions);
router.get('/user/:userId/history', protect, authorize('admin'), getUserTransactionHistory);

module.exports = router; 