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
    getUserTransactionHistory,
    getUserStatistics,
    returnBookById
} = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/auth');

// User routes
router.use(protect);
router.post('/borrow/:bookId', borrowBook);
router.post('/return/:bookId', returnBook);
router.post('/:transactionId/return', returnBookById);
router.get('/history', getBorrowingHistory);
router.get('/statistics', getUserStatistics);

// Admin routes
router.use(authorize('admin'));
router.get('/', getAllTransactions);
router.get('/active', getActiveTransactions);
router.get('/overdue', getOverdueTransactions);
router.get('/student-dues/:userId', getStudentDues);
router.get('/book/:bookId', getBookTransactions);
router.post('/issue', issueBook);
router.get('/user/:userId/active', getUserActiveTransactions);
router.get('/user/:userId/history', getUserTransactionHistory);

module.exports = router; 