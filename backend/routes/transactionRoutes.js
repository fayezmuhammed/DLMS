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

// New endpoint to return a book by transaction ID
router.post('/:transactionId/return', protect, async (req, res) => {
    try {
        const Transaction = require('../models/Transaction');
        const Book = require('../models/Book');
        
        // Find the transaction by ID and ensure it belongs to the logged-in user or user is admin
        const transaction = await Transaction.findById(req.params.transactionId);
        
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }
        
        // Security check - ensure the transaction belongs to the user or user is admin
        if (transaction.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to return this book'
            });
        }
        
        // Only allow return if status is borrowed or overdue
        if (!['borrowed', 'overdue'].includes(transaction.status)) {
            return res.status(400).json({
                success: false, 
                message: 'This book has already been returned'
            });
        }
        
        // Update transaction
        transaction.status = 'returned';
        transaction.returnDate = new Date();
        await transaction.save();
        
        // Update book status - check if there are any remaining active transactions
        const book = await Book.findById(transaction.book);
        if (book) {
            const remainingActiveTransactions = await Transaction.countDocuments({
                book: transaction.book,
                status: { $in: ['borrowed', 'overdue'] }
            });
            
            // Only change status to Available if there are no more active transactions
            if (remainingActiveTransactions === 0) {
                book.status = 'Available';
                await book.save();
            }
        }
        
        res.json({
            success: true,
            data: transaction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

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