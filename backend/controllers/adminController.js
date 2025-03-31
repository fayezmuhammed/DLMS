const Book = require('../models/Book');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const EBook = require('../models/EBook');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
    try {
        // Get counts in parallel for better performance
        const [totalBooks, totalEbooks, totalUsers, allTransactions] = await Promise.all([
            Book.countDocuments({}),
            EBook.countDocuments({}),
            User.countDocuments({}),
            Transaction.find({}).lean()
        ]);

        // Filter transactions by status
        const today = new Date();
        let activeTransactions = 0;
        let overdueTransactions = 0;

        allTransactions.forEach(transaction => {
            if (transaction.status === 'borrowed') {
                activeTransactions++;
                
                // Check if borrowed transaction is overdue
                if (new Date(transaction.dueDate) < today) {
                    overdueTransactions++;
                }
            } else if (transaction.status === 'overdue') {
                overdueTransactions++;
            }
        });

        // Return dashboard statistics
        res.json({
            success: true,
            data: {
                totalBooks,
                totalEbooks,
                totalUsers,
                activeTransactions,
                overdueTransactions,
                recentlyAddedBooks: 0, // This could be added later
                updatedAt: new Date()
            }
        });
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Get recent users with book counts
// @route   GET /api/admin/top-users
// @access  Private/Admin
exports.getTopUsers = async (req, res) => {
    try {
        // Get all users ordered by most recent
        const users = await User.find({})
            .sort({ createdAt: -1 })
            .limit(4)
            .lean();
            
        // Get active transaction counts for each user
        const userIds = users.map(user => user._id);
        const transactions = await Transaction.find({ 
            user: { $in: userIds },
            status: 'borrowed'
        }).lean();
        
        // Count books issued per user
        const userBooksCount = {};
        transactions.forEach(transaction => {
            const userId = transaction.user.toString();
            userBooksCount[userId] = (userBooksCount[userId] || 0) + 1;
        });
        
        // Add book counts to users
        const usersWithCounts = users.map(user => ({
            ...user,
            booksIssued: userBooksCount[user._id.toString()] || 0
        }));
        
        res.json({
            success: true,
            count: usersWithCounts.length,
            data: usersWithCounts
        });
    } catch (error) {
        console.error('Error getting top users:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Get recently added books
// @route   GET /api/admin/recent-books
// @access  Private/Admin
exports.getRecentBooks = async (req, res) => {
    try {
        const books = await Book.find({})
            .sort({ createdAt: -1 })
            .limit(4)
            .populate('category', 'name')
            .lean();
            
        res.json({
            success: true,
            count: books.length,
            data: books
        });
    } catch (error) {
        console.error('Error getting recent books:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// @desc    Get recently added e-books
// @route   GET /api/admin/recent-ebooks
// @access  Private/Admin
exports.getRecentEBooks = async (req, res) => {
    try {
        const ebooks = await EBook.find({})
            .sort({ createdAt: -1 })
            .limit(4)
            .populate('category', 'name')
            .lean();
            
        res.json({
            success: true,
            count: ebooks.length,
            data: ebooks
        });
    } catch (error) {
        console.error('Error getting recent e-books:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
}; 