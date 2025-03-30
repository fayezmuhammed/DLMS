const express = require('express');
const router = express.Router();
const { getBooks, addBook, updateBook, deleteBook } = require('../controllers/bookController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getBooks);
router.post('/add', protect, authorize('admin'), addBook);
router.put('/update/:id', protect, authorize('admin'), updateBook);
router.delete('/delete/:id', protect, authorize('admin'), deleteBook);

module.exports = router; 