const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const User = require('../models/User');
const Settings = require('../models/Settings');

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

        // Get the user
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get borrowing rules from settings
        const settings = await Settings.getSettings();
        const userRole = user.role.toLowerCase();
        
        // Determine maximum books allowed based on user role
        const maxBooks = userRole === 'teacher' ? 
            settings.maxBooksTeacher : settings.maxBooksStudent;
        
        // Determine loan period (days) based on user role
        const loanDays = userRole === 'teacher' ? 
            settings.maxDaysTeacher : settings.maxDaysStudent;
        
        // Check how many books the user has already borrowed
        const activeBorrows = await Transaction.countDocuments({
            user: req.user._id,
            status: { $in: ['borrowed', 'overdue'] }
        });
        
        // Check if user has reached their borrowing limit
        if (activeBorrows >= maxBooks) {
            return res.status(400).json({
                success: false,
                message: `You have reached your borrowing limit of ${maxBooks} books`
            });
        }

        // Check if the user already has an active transaction for this book
        const existingTransaction = await Transaction.findOne({
            book: req.params.bookId,
            user: req.user._id,
            status: { $in: ['borrowed', 'overdue'] }
        });

        if (existingTransaction) {
            return res.status(400).json({
                success: false,
                message: 'You have already borrowed this book'
            });
        }

        // Get active transactions for this book to determine how many copies are already issued
        const activeTransactions = await Transaction.countDocuments({
            book: req.params.bookId,
            status: { $in: ['borrowed', 'overdue'] }
        });

        // Check if all copies are already issued
        if (activeTransactions >= book.copies) {
            return res.status(400).json({
                success: false,
                message: `All copies of this book are already issued. Total copies: ${book.copies}, Currently issued: ${activeTransactions}`
            });
        }

        // Set due date based on borrowing rules
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + loanDays);

        const transaction = await Transaction.create({
            user: req.user._id,
            book: req.params.bookId,
            dueDate,
            status: 'borrowed'
        });

        // Update book status only if all copies are now issued
        const newActiveCount = activeTransactions + 1;
        if (newActiveCount >= book.copies) {
            book.status = 'Issued';
        } else if (book.status !== 'Available' && newActiveCount < book.copies) {
            // If some copies are now available, update status
            book.status = 'Available';
        }
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

        // Update book status - check if there are any remaining active transactions
        const book = await Book.findById(req.params.bookId);
        if (book) {
            const remainingActiveTransactions = await Transaction.countDocuments({
                book: req.params.bookId,
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

// @desc    Get all transactions for a specific book (admin only)
// @route   GET /api/transactions/book/:bookId
// @access  Private/Admin
exports.getBookTransactions = async (req, res) => {
    try {
        const bookId = req.params.bookId;
        
        const transactions = await Transaction.find({ book: bookId })
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

// @desc    Get student dues
// @route   GET /api/transactions/student-dues/:userId
// @access  Private/Admin
exports.getStudentDues = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Get settings for fine calculation
        const settings = await Settings.getSettings();
        const finePerDay = settings.finePerDay;
        
        // Find active or overdue transactions for this user
        const transactions = await Transaction.find({
            user: userId,
            status: { $in: ['borrowed', 'overdue'] }
        }).populate('book', 'title author ISBN');
        
        // Check for overdue transactions and calculate fines
        const today = new Date();
        const dues = [];
        
        for (let transaction of transactions) {
            const dueDate = new Date(transaction.dueDate);
            
            // Update status to overdue if past due date
            if (transaction.status === 'borrowed' && dueDate < today) {
                transaction.status = 'overdue';
                await transaction.save();
            }
            
            // Calculate fine if overdue
            if (dueDate < today) {
                const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
                const fine = daysOverdue * finePerDay;
                
                dues.push({
                    bookTitle: transaction.book.title,
                    dueDate: transaction.dueDate,
                    fine: fine.toFixed(2)
                });
            }
        }
        
        res.json({
            success: true,
            count: dues.length,
            data: dues
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving student dues',
            error: error.message
        });
    }
};

// @desc    Issue a book to a user (admin only)
// @route   POST /api/transactions/issue
// @access  Private/Admin
exports.issueBook = async (req, res) => {
    try {
        const { bookId, userId, issueDate } = req.body;

        // Validate input
        if (!bookId || !userId || !issueDate) {
            return res.status(400).json({
                success: false,
                message: 'Please provide book ID, user ID, and issue date'
            });
        }

        // Check if book exists
        const book = await Book.findById(bookId);
        
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        // Get the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get borrowing rules from settings
        const settings = await Settings.getSettings();
        const userRole = user.role.toLowerCase();
        
        // Determine maximum books allowed based on user role
        const maxBooks = userRole === 'teacher' ? 
            settings.maxBooksTeacher : settings.maxBooksStudent;
        
        // Determine loan period (days) based on user role
        const loanDays = userRole === 'teacher' ? 
            settings.maxDaysTeacher : settings.maxDaysStudent;
        
        // Check how many books the user has already borrowed
        const activeBorrows = await Transaction.countDocuments({
            user: userId,
            status: { $in: ['borrowed', 'overdue'] }
        });
        
        // Check if user has reached their borrowing limit
        if (activeBorrows >= maxBooks) {
            return res.status(400).json({
                success: false,
                message: `User has reached their borrowing limit of ${maxBooks} books`
            });
        }

        // Check if the user already has an active transaction for this book
        const existingTransaction = await Transaction.findOne({
            book: bookId,
            user: userId,
            status: { $in: ['borrowed', 'overdue'] }
        });

        if (existingTransaction) {
            return res.status(400).json({
                success: false,
                message: 'This user has already borrowed this book'
            });
        }

        // Get active transactions for this book to determine how many copies are already issued
        const activeTransactions = await Transaction.countDocuments({
            book: bookId,
            status: { $in: ['borrowed', 'overdue'] }
        });

        // Check if all copies are already issued
        if (activeTransactions >= book.copies) {
            return res.status(400).json({
                success: false,
                message: `All copies of this book are already issued. Total copies: ${book.copies}, Currently issued: ${activeTransactions}`
            });
        }

        // Calculate due date based on loan days from settings
        const dueDate = new Date(issueDate);
        dueDate.setDate(dueDate.getDate() + loanDays);

        // Create transaction
        const transaction = await Transaction.create({
            user: userId,
            book: bookId,
            issueDate: new Date(issueDate),
            dueDate: dueDate,
            status: 'borrowed'
        });

        // Update book status only if all copies are now issued
        const newActiveCount = activeTransactions + 1;
        if (newActiveCount >= book.copies) {
            book.status = 'Issued';
        } else if (book.status !== 'Available' && newActiveCount < book.copies) {
            // If some copies are now available, update status
            book.status = 'Available';
        }
        await book.save();

        // Populate transaction with book and user details
        const populatedTransaction = await Transaction.findById(transaction._id)
            .populate('book', 'title author ISBN imagePath')
            .populate('user', 'name email');

        res.status(201).json({
            success: true,
            data: populatedTransaction
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get a user's active transactions (admin only)
// @route   GET /api/transactions/user/:userId/active
// @access  Private/Admin
exports.getUserActiveTransactions = async (req, res) => {
    try {
        // Find the active transactions for the specified user
        const transactions = await Transaction.find({ 
            user: req.params.userId,
            status: { $in: ['borrowed', 'overdue'] }
        })
            .populate('book', 'title author ISBN imagePath coverImage')
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

// @desc    Get a user's transaction history (admin only)
// @route   GET /api/transactions/user/:userId/history
// @access  Private/Admin
exports.getUserTransactionHistory = async (req, res) => {
    try {
        // Find the returned transactions for the specified user
        const transactions = await Transaction.find({ 
            user: req.params.userId,
            status: 'returned'
        })
            .populate('book', 'title author ISBN imagePath coverImage')
            .sort('-createdAt');

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