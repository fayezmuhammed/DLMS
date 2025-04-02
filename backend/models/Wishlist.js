const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    addedDate: {
        type: Date,
        default: Date.now
    }
});

// Ensure a user can only add a book to their wishlist once
wishlistSchema.index({ user: 1, book: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema); 