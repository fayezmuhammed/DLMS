const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Get monthly borrowing trends
// @route   GET /api/reports/borrowing-trends
// @access  Private/Admin
exports.getBorrowingTrends = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Validate date parameters
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format'
            });
        }
        
        // Get transactions grouped by month
        const transactions = await Transaction.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: { 
                        month: { $month: "$createdAt" }, 
                        year: { $year: "$createdAt" } 
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);
        
        // Format data for frontend charts
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        // Create a map to store counts for each month
        const monthlyData = {};
        transactions.forEach(t => {
            const monthIdx = t._id.month - 1; // MongoDB months are 1-indexed
            const month = months[monthIdx];
            monthlyData[month] = t.count;
        });
        
        // Create an array with all months, filling in zeros for months without data
        const formattedData = months.map(month => ({
            month,
            count: monthlyData[month] || 0
        }));
        
        res.json({
            success: true,
            data: formattedData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving borrowing trends',
            error: error.message
        });
    }
};

// @desc    Get book category distribution
// @route   GET /api/reports/category-distribution
// @access  Private/Admin
exports.getCategoryDistribution = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Validate date parameters
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format'
            });
        }
        
        // Get book categories distribution
        const categoryDistribution = await Book.aggregate([
            {
                $group: {
                    _id: "$category",
                    value: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: "$_id",
                    value: 1
                }
            },
            {
                $sort: { value: -1 }
            }
        ]);
        
        res.json({
            success: true,
            data: categoryDistribution
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving category distribution',
            error: error.message
        });
    }
};

// @desc    Get overdue analysis
// @route   GET /api/reports/overdue-analysis
// @access  Private/Admin
exports.getOverdueAnalysis = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Validate date parameters
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format'
            });
        }
        
        // Count all transactions
        const totalTransactions = await Transaction.countDocuments({
            createdAt: { $gte: start, $lte: end }
        });
        
        // Count overdue transactions
        const overdueTransactions = await Transaction.countDocuments({
            createdAt: { $gte: start, $lte: end },
            status: 'overdue'
        });
        
        // Calculate on-time returns
        const onTimeValue = totalTransactions - overdueTransactions;
        const overdueValue = overdueTransactions;
        
        // Format data for pie chart
        const formattedData = [
            { name: 'On Time', value: onTimeValue },
            { name: 'Overdue', value: overdueValue }
        ];
        
        res.json({
            success: true,
            data: formattedData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving overdue analysis',
            error: error.message
        });
    }
};

// @desc    Get popular books
// @route   GET /api/reports/popular-books
// @access  Private/Admin
exports.getPopularBooks = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Validate date parameters
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format'
            });
        }
        
        // Get popular books based on transaction count
        const popularBooks = await Transaction.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: "$book",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 10
            },
            {
                $lookup: {
                    from: 'books',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'bookDetails'
                }
            },
            {
                $unwind: '$bookDetails'
            },
            {
                $project: {
                    _id: 0,
                    name: '$bookDetails.title',
                    count: 1
                }
            }
        ]);
        
        res.json({
            success: true,
            data: popularBooks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving popular books',
            error: error.message
        });
    }
}; 