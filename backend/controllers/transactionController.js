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

        if (!book.availability) {
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

        // Update book availability
        book.availability = false;
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

        // Update book availability
        const book = await Book.findById(req.params.bookId);
        book.availability = true;
        await book.save();

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
            .populate('book', 'title author isbn')
            .sort('-createdAt');

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