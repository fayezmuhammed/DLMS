const Transaction = require('../models/Transaction');
const Book = require('../models/Book');

// @desc    Borrow a book
// @route   POST /api/transactions/borrow/:bookId
// @access  Private
exports.borrowBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.bookId);
        
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        // Check if book is available
        if (book.status !== 'Available') {
            return res.status(400).json({
                success: false,
                message: 'Book is not available for borrowing'
            });
        }

        // Set due date to 14 days from now
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        const transaction = await Transaction.create({
            user: req.user._id,
            book: req.params.bookId,
            dueDate
        });

        // Update book status
        book.status = 'Issued';
        await book.save();

        res.status(201).json({
            success: true,
            data: transaction
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Return a book
// @route   POST /api/transactions/return/:bookId
// @access  Private
exports.returnBook = async (req, res) => {
    try {
        const transaction = await Transaction.findOne({
            book: req.params.bookId,
            user: req.user._id,
            status: 'borrowed'
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'No active transaction found for this book'
            });
        }

        // Update transaction
        transaction.status = 'returned';
        transaction.returnDate = new Date();
        await transaction.save();

        // Update book status
        const book = await Book.findById(req.params.bookId);
        if (book) {
            book.status = 'Available';
            await book.save();
        }

        res.json({
            success: true,
            data: transaction
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get user's borrowing history
// @route   GET /api/transactions/history
// @access  Private
exports.getBorrowingHistory = async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user._id })
            .populate('book', 'title author ISBN imagePath')
            .sort('-createdAt');

        // Update overdue status
        const today = new Date();
        for (let transaction of transactions) {
            if (transaction.status === 'borrowed' && new Date(transaction.dueDate) < today) {
                transaction.status = 'overdue';
                await transaction.save();
            }
        }

        res.json({
            success: true,
            count: transactions.length,
            data: transactions
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all transactions (admin only)
// @route   GET /api/transactions
// @access  Private/Admin
exports.getAllTransactions = async (req, res) => {
    try {
        // Parse query params for filtering
        const status = req.query.status;
        
        // Build query
        let query = {};
        if (status) {
            query.status = status;
        }
        
        const transactions = await Transaction.find(query)
            .populate('book', 'title author ISBN imagePath')
            .populate('user', 'name email')
            .sort('-createdAt');
            
        // Update overdue status
        const today = new Date();
        for (let transaction of transactions) {
            if (transaction.status === 'borrowed' && new Date(transaction.dueDate) < today) {
                transaction.status = 'overdue';
                await transaction.save();
            }
        }

        res.json({
            success: true,
            count: transactions.length,
            data: transactions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Get active transactions (admin only)
// @route   GET /api/transactions/active
// @access  Private/Admin
exports.getActiveTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ status: 'borrowed' })
            .populate('book', 'title author ISBN imagePath')
            .populate('user', 'name email')
            .sort('-createdAt');
            
        // Update overdue status
        const today = new Date();
        for (let transaction of transactions) {
            if (new Date(transaction.dueDate) < today) {
                transaction.status = 'overdue';
                await transaction.save();
            }
        }
        
        // Get final list after updates
        const activeTransactions = await Transaction.find({ status: 'borrowed' })
            .populate('book', 'title author ISBN imagePath')
            .populate('user', 'name email')
            .sort('-createdAt');

        res.json({
            success: true,
            count: activeTransactions.length,
            data: activeTransactions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Get overdue transactions (admin only)
// @route   GET /api/transactions/overdue
// @access  Private/Admin
exports.getOverdueTransactions = async (req, res) => {
    try {
        // Update overdue status for all borrowed books
        const today = new Date();
        const borrowedTransactions = await Transaction.find({ status: 'borrowed' });
        
        for (let transaction of borrowedTransactions) {
            if (new Date(transaction.dueDate) < today) {
                transaction.status = 'overdue';
                await transaction.save();
            }
        }
        
        // Get all overdue transactions
        const overdueTransactions = await Transaction.find({ status: 'overdue' })
            .populate('book', 'title author ISBN imagePath')
            .populate('user', 'name email')
            .sort('-createdAt');

        res.json({
            success: true,
            count: overdueTransactions.length,
            data: overdueTransactions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
}; 