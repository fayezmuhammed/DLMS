const express = require('express');
const router = express.Router();
const { borrowBook, returnBook, getBorrowingHistory } = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

router.post('/borrow/:bookId', protect, borrowBook);
router.post('/return/:bookId', protect, returnBook);
router.get('/history', protect, getBorrowingHistory);

module.exports = router; 