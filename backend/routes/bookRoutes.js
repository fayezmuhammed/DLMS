const express = require('express');
const router = express.Router();
const { 
    getBooks, 
    getBookById, 
    addBook, 
    updateBook, 
    deleteBook,
    bulkImportBooks 
} = require('../controllers/bookController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getBooks);
router.get('/:id', getBookById);

router.post('/add', protect, authorize('admin'), addBook);
router.post('/import', protect, authorize('admin'), bulkImportBooks);
router.put('/update/:id', protect, authorize('admin'), updateBook);
router.delete('/delete/:id', protect, authorize('admin'), deleteBook);

module.exports = router; 