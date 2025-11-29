const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const User = require('../models/User');
const Settings = require('../models/Settings');

// Cache for settings to avoid frequent DB queries
let settingsCache = null;
let settingsCacheTime = 0;
const SETTINGS_CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

// Get settings with cache
const getSettings = async () => {
    const now = Date.now();
    if (settingsCache && now - settingsCacheTime < SETTINGS_CACHE_TTL) {
        return settingsCache;
    }
    
    const settings = await Settings.getSettings();
    settingsCache = settings;
    settingsCacheTime = now;
    return settings;
};

// Helper function to check book availability - optimized queries
const checkBookAvailability = async (bookId, userId) => {
    // Use Promise.all to run queries in parallel
    const [book, user, activeBookTransactions, activeBorrows] = await Promise.all([
        Book.findById(bookId),
        User.findById(userId),
        Transaction.countDocuments({
            book: bookId,
            status: { $in: ['borrowed', 'overdue'] }
        }),
        Transaction.countDocuments({
            user: userId,
            status: { $in: ['borrowed', 'overdue'] }
        })
    ]);
    
    if (!book) throw new Error('Book not found');
    if (!user) throw new Error('User not found');
    
    const settings = await getSettings();
    const userRole = user.role.toLowerCase();
    const maxBooks = userRole === 'teacher' ? settings.maxBooksTeacher : settings.maxBooksStudent;
    const loanDays = userRole === 'teacher' ? settings.maxDaysTeacher : settings.maxDaysStudent;
    
    if (activeBorrows >= maxBooks) throw new Error(`You have reached your borrowing limit of ${maxBooks} books`);
    
    // Check if user already has this book
    const existingTransaction = await Transaction.findOne({
        book: bookId,
        user: userId,
        status: { $in: ['borrowed', 'overdue'] }
    });
    
    if (existingTransaction) throw new Error('You have already borrowed this book');
    
    if (activeBookTransactions >= book.copies) {
        throw new Error(`All copies of this book are already issued. Total copies: ${book.copies}, Currently issued: ${activeBookTransactions}`);
    }
    
    return { book, loanDays };
};

// Helper function to update book status - with projection to improve performance
const updateBookStatus = async (bookId) => {
    const book = await Book.findById(bookId, { status: 1, copies: 1 });
    if (!book) return;
    
    const remainingActiveTransactions = await Transaction.countDocuments({
        book: bookId,
        status: { $in: ['borrowed', 'overdue'] }
    });
    
    if ((book.status === 'Available' && remainingActiveTransactions === 0) || 
        (book.status === 'Issued' && remainingActiveTransactions > 0)) {
        return; // No need to update if status is already correct
    }
    
    book.status = remainingActiveTransactions === 0 ? 'Available' : 'Issued';
    await book.save();
};

// Helper function to update overdue status - with bulk operations
const updateOverdueStatus = async (transactions) => {
    const today = new Date();
    const toUpdate = [];
    
    for (let transaction of transactions) {
        if (transaction.status === 'borrowed' && new Date(transaction.dueDate) < today) {
            transaction.status = 'overdue';
            toUpdate.push(transaction._id);
        }
    }
    
    if (toUpdate.length > 0) {
        await Transaction.updateMany(
            { _id: { $in: toUpdate } },
            { $set: { status: 'overdue' } }
        );
    }
};

// @desc    Borrow a book
// @route   POST /api/transactions/borrow/:bookId
// @access  Private
exports.borrowBook = async (req, res) => {
    try {
        const { book, loanDays } = await checkBookAvailability(req.params.bookId, req.user._id);
        
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + loanDays);
        
        const transaction = await Transaction.create({
            user: req.user._id,
            book: req.params.bookId,
            dueDate,
            status: 'borrowed'
        });
        
        await updateBookStatus(req.params.bookId);
        
        res.status(201).json({ success: true, data: transaction });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
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
            status: { $in: ['borrowed', 'overdue'] }
        });
        
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'No active transaction found for this book' });
        }
        
        transaction.status = 'returned';
        transaction.returnDate = new Date();
        await transaction.save();
        
        await updateBookStatus(req.params.bookId);
        
        res.json({ success: true, data: transaction });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Return a book by transaction ID
exports.returnBookById = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.transactionId);
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
        
        if (transaction.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to return this book' });
        }
        
        if (!['borrowed', 'overdue'].includes(transaction.status)) {
            return res.status(400).json({ success: false, message: 'This book has already been returned' });
        }
        
        transaction.status = 'returned';
        transaction.returnDate = new Date();
        await transaction.save();
        
        await updateBookStatus(transaction.book);
        
        res.json({ success: true, data: transaction });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get user's borrowing history
// @route   GET /api/transactions/history
// @access  Private
exports.getBorrowingHistory = async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user._id })
            .populate('book', 'title author ISBN imagePath')
            .sort('-createdAt')
            .lean(); // Use lean for better performance
            
        await updateOverdueStatus(transactions);
        
        res.json({ success: true, count: transactions.length, data: transactions });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get all transactions (admin only)
// @route   GET /api/transactions
// @access  Private/Admin
exports.getAllTransactions = async (req, res) => {
    try {
        const query = req.query.status ? { status: req.query.status } : {};
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;
        
        const [transactions, total] = await Promise.all([
            Transaction.find(query)
                .populate('book', 'title author ISBN imagePath')
                .populate('user', 'name email')
                .sort('-createdAt')
                .skip(skip)
                .limit(limit)
                .lean(),
            Transaction.countDocuments(query)
        ]);
            
        await updateOverdueStatus(transactions);
        
        res.json({ 
            success: true, 
            count: transactions.length, 
            total,
            pages: Math.ceil(total / limit),
            currentPage: page,
            data: transactions 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get all transactions for a specific book (admin only)
// @route   GET /api/transactions/book/:bookId
// @access  Private/Admin
exports.getBookTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ book: req.params.bookId })
            .populate('book', 'title author ISBN imagePath')
            .populate('user', 'name email')
            .sort('-createdAt')
            .lean();
            
        await updateOverdueStatus(transactions);
        
        res.json({ success: true, count: transactions.length, data: transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get active transactions (admin only)
// @route   GET /api/transactions/active
// @access  Private/Admin
exports.getActiveTransactions = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;
        
        const [transactions, total] = await Promise.all([
            Transaction.find({ status: { $in: ['borrowed', 'overdue'] } })
                .populate('book', 'title author ISBN imagePath')
                .populate('user', 'name email')
                .sort('-createdAt')
                .skip(skip)
                .limit(limit)
                .lean(),
            Transaction.countDocuments({ status: { $in: ['borrowed', 'overdue'] } })
        ]);
            
        await updateOverdueStatus(transactions);
        
        res.json({ 
            success: true, 
            count: transactions.length, 
            total,
            pages: Math.ceil(total / limit),
            currentPage: page,
            data: transactions 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get overdue transactions (admin only)
// @route   GET /api/transactions/overdue
// @access  Private/Admin
exports.getOverdueTransactions = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;
        
        const [transactions, total] = await Promise.all([
            Transaction.find({ status: 'overdue' })
                .populate('book', 'title author ISBN imagePath')
                .populate('user', 'name email')
                .sort('-createdAt')
                .skip(skip)
                .limit(limit)
                .lean(),
            Transaction.countDocuments({ status: 'overdue' })
        ]);
            
        res.json({ 
            success: true, 
            count: transactions.length, 
            total,
            pages: Math.ceil(total / limit),
            currentPage: page,
            data: transactions 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get student dues
// @route   GET /api/transactions/student-dues/:userId
// @access  Private/Admin
exports.getStudentDues = async (req, res) => {
    try {
        const transactions = await Transaction.find({
            user: req.params.userId,
            status: { $in: ['borrowed', 'overdue'] }
        })
        .populate('book', 'title author ISBN imagePath')
        .sort('-createdAt')
        .lean();
        
        await updateOverdueStatus(transactions);
        
        res.json({ success: true, count: transactions.length, data: transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Issue a book to a user (admin only)
// @route   POST /api/transactions/issue
// @access  Private/Admin
exports.issueBook = async (req, res) => {
    try {
        const { book, loanDays } = await checkBookAvailability(req.body.bookId, req.body.userId);
        
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + loanDays);
        
        const transaction = await Transaction.create({
            user: req.body.userId,
            book: req.body.bookId,
            dueDate,
            status: 'borrowed'
        });
        
        await updateBookStatus(req.body.bookId);
        
        // Populate with book and user details for admin UI
        const populatedTransaction = await Transaction.findById(transaction._id)
            .populate('book', 'title author ISBN imagePath')
            .populate('user', 'name email');
        
        res.status(201).json({ success: true, data: populatedTransaction });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get a user's active transactions (admin only)
// @route   GET /api/transactions/user/:userId/active
// @access  Private/Admin
exports.getUserActiveTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({
            user: req.params.userId,
            status: { $in: ['borrowed', 'overdue'] }
        })
        .populate('book', 'title author ISBN imagePath')
        .sort('-createdAt')
        .lean();
        
        await updateOverdueStatus(transactions);
        
        res.json({ success: true, count: transactions.length, data: transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get a user's transaction history (admin only)
// @route   GET /api/transactions/user/:userId/history
// @access  Private/Admin
exports.getUserTransactionHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;
        
        const [transactions, total] = await Promise.all([
            Transaction.find({ user: req.params.userId })
                .populate('book', 'title author ISBN imagePath')
                .sort('-createdAt')
                .skip(skip)
                .limit(limit)
                .lean(),
            Transaction.countDocuments({ user: req.params.userId })
        ]);
            
        await updateOverdueStatus(transactions);
        
        res.json({ 
            success: true, 
            count: transactions.length, 
            total,
            pages: Math.ceil(total / limit),
            currentPage: page,
            data: transactions 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get user's borrowing statistics
// @route   GET /api/transactions/statistics
// @access  Private
exports.getUserStatistics = async (req, res) => {
    try {
        const stats = await Transaction.aggregate([
            { $match: { user: req.user._id } },
            { $group: {
                _id: '$status',
                count: { $sum: 1 }
            }}
        ]);
        
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
}; 