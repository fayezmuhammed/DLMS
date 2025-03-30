const Book = require('../models/Book');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/books');
    },
    filename: function(req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function(req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
}).single('image');

// @desc    Get all books
// @route   GET /api/books
// @access  Public
exports.getBooks = async (req, res) => {
    try {
        const books = await Book.find().populate('category', 'name');
        res.json({
            success: true,
            count: books.length,
            data: books
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Add a new book
// @route   POST /api/books/add
// @access  Private/Admin
exports.addBook = async (req, res) => {
    upload(req, res, async function(err) {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        try {
            // Log the incoming data
            console.log('Request body:', req.body);
            console.log('File:', req.file);

            // Validate required fields
            // Map ISBN to isbn for consistency
            if (req.body.ISBN && !req.body.isbn) {
                req.body.isbn = req.body.ISBN;
                delete req.body.ISBN;
            }

            const requiredFields = ['title', 'author', 'isbn', 'category'];
            const missingFields = requiredFields.filter(field => !req.body[field]);
            
            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Missing required fields: ${missingFields.join(', ')}`
                });
            }

            // Validate ISBN specifically
            if (!req.body.isbn || req.body.isbn.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'ISBN cannot be empty'
                });
            }

            // Check if ISBN already exists
            const existingBook = await Book.findOne({ isbn: req.body.isbn });
            if (existingBook) {
                return res.status(400).json({
                    success: false,
                    message: 'A book with this ISBN already exists'
                });
            }

            const bookData = {
                ...req.body,
                isbn: req.body.isbn.trim(),
                image: req.file ? `/uploads/books/${req.file.filename}` : undefined
            };

            // Convert copies to number if it's a string
            if (typeof bookData.copies === 'string') {
                bookData.copies = parseInt(bookData.copies, 10);
            }

            const book = await Book.create(bookData);
            
            // Populate the category field in the response
            const populatedBook = await Book.findById(book._id).populate('category', 'name');
            
            res.status(201).json({
                success: true,
                data: populatedBook
            });
        } catch (error) {
            console.error('Error creating book:', error);
            res.status(400).json({
                success: false,
                message: error.message || 'Error creating book'
            });
        }
    });
};

// @desc    Update book
// @route   PUT /api/books/update/:id
// @access  Private/Admin
exports.updateBook = async (req, res) => {
    try {
        const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate('category', 'name');

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        res.json({
            success: true,
            data: book
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete book
// @route   DELETE /api/books/delete/:id
// @access  Private/Admin
exports.deleteBook = async (req, res) => {
    try {
        const book = await Book.findByIdAndDelete(req.params.id);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        res.json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}; 