const express = require('express');
const {
    getWishlist,
    addToWishlist,
    removeFromWishlist
} = require('../controllers/wishlistController');

const router = express.Router();

// Protect middleware to ensure users are authenticated
const { protect } = require('../middleware/auth');

// All wishlist routes require authentication
router.use(protect);

router.get('/', getWishlist);
router.post('/add', addToWishlist);
router.delete('/remove/:bookId', removeFromWishlist);

module.exports = router; 