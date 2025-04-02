const Wishlist = require('../models/Wishlist');
const Book = require('../models/Book');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
exports.getWishlist = asyncHandler(async (req, res, next) => {
    const wishlistItems = await Wishlist.find({ user: req.user.id })
        .populate({
            path: 'book',
            select: 'title author isbn status coverImage image imagePath'
        })
        .sort({ addedDate: -1 });

    res.status(200).json({
        success: true,
        data: wishlistItems
    });
});

// @desc    Add a book to wishlist
// @route   POST /api/wishlist/add
// @access  Private
exports.addToWishlist = asyncHandler(async (req, res, next) => {
    const { bookId } = req.body;

    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
        return next(new ErrorResponse(`Book not found with id of ${bookId}`, 404));
    }

    // Check if already in wishlist
    const existing = await Wishlist.findOne({
        user: req.user.id,
        book: bookId
    });

    if (existing) {
        return res.status(200).json({
            success: true,
            message: 'Book is already in your wishlist',
            data: existing
        });
    }

    // Add to wishlist
    const wishlistItem = await Wishlist.create({
        user: req.user.id,
        book: bookId
    });

    res.status(201).json({
        success: true,
        message: 'Book added to wishlist',
        data: wishlistItem
    });
});

// @desc    Remove a book from wishlist
// @route   DELETE /api/wishlist/remove/:bookId
// @access  Private
exports.removeFromWishlist = asyncHandler(async (req, res, next) => {
    const { bookId } = req.params;

    const result = await Wishlist.deleteOne({
        user: req.user.id,
        book: bookId
    });

    if (result.deletedCount === 0) {
        return next(new ErrorResponse(`Book not found in wishlist`, 404));
    }

    res.status(200).json({
        success: true,
        message: 'Book removed from wishlist',
        data: {}
    });
}); 