const Book = require('../models/Book');
const multer = require('multer');
const path = require('path');
const cloudinaryService = require('../services/cloudinaryService');
const { upload: excelUpload, processExcelImport } = require('../scripts/importBooks');

// Configure multer for memory storage (instead of disk)
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
}).single('image');

// @desc    Get all books
// @route   GET /api/books
// @access  Public
const Transaction = require('../models/Transaction');

// @desc    Get all books
// @route   GET /api/books
// @access  Public
exports.getBooks = async (req, res) => {
    try {
        const books = await Book.find().populate('category', 'name');

        // Calculate available copies for each book
        const booksWithAvailability = await Promise.all(books.map(async (book) => {
            // Get active transactions (borrowed or overdue)
            const activeTransactions = await Transaction.countDocuments({
                book: book._id,
                status: { $in: ['borrowed', 'overdue'] }
            });

            const availableCopies = Math.max(0, book.copies - activeTransactions);

            return {
                ...book.toObject(),
                availableCopies
            };
        }));

        res.json({
            success: true,
            count: booksWithAvailability.length,
            data: booksWithAvailability
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get a single book
// @route   GET /api/books/:id
// @access  Public
exports.getBookById = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id).populate('category', 'name');

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        // Get active transactions
        const activeTransactions = await Transaction.countDocuments({
            book: book._id,
            status: { $in: ['borrowed', 'overdue'] }
        });

        const availableCopies = Math.max(0, book.copies - activeTransactions);

        const bookWithAvailability = {
            ...book.toObject(),
            availableCopies
        };

        res.json({
            success: true,
            book: bookWithAvailability
        });
    } catch (error) {
        console.error('Error fetching book by ID:', error);
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
    upload(req, res, async function (err) {
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

            const requiredFields = ['title', 'author', 'bookNo'];
            const missingFields = requiredFields.filter(field => !req.body[field]);

            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Missing required fields: ${missingFields.join(', ')}`
                });
            }

            // Validate bookNo
            if (!req.body.bookNo || req.body.bookNo.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Book number cannot be empty'
                });
            }

            // Check if ISBN or bookNo already exists
            const existingBookQuery = { bookNo: req.body.bookNo };

            // Only check ISBN uniqueness if provided
            if (req.body.isbn && req.body.isbn.trim() !== '') {
                existingBookQuery.$or = [
                    { bookNo: req.body.bookNo },
                    { isbn: req.body.isbn }
                ];
            }

            const existingBook = await Book.findOne(existingBookQuery);

            if (existingBook) {
                if (req.body.isbn && existingBook.isbn === req.body.isbn) {
                    return res.status(400).json({
                        success: false,
                        message: 'A book with this ISBN already exists'
                    });
                }
                if (existingBook.bookNo === req.body.bookNo) {
                    return res.status(400).json({
                        success: false,
                        message: 'A book with this book number already exists'
                    });
                }
            }

            let imageUrl = '';
            let imagePublicId = '';

            // Upload image to Cloudinary if provided
            if (req.file) {
                const result = await cloudinaryService.uploadBookCover(
                    req.file.buffer,
                    req.file.originalname
                );
                imageUrl = result.secure_url;
                imagePublicId = result.public_id;
            }

            const bookData = {
                ...req.body,
                bookNo: req.body.bookNo.trim(),
                image: imageUrl || undefined,
                imagePublicId: imagePublicId || undefined
            };

            // Add ISBN only if provided
            if (req.body.isbn) {
                bookData.isbn = req.body.isbn.trim();
            }

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
    upload(req, res, async function (err) {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        try {
            // Find the existing book
            const existingBook = await Book.findById(req.params.id);

            if (!existingBook) {
                return res.status(404).json({
                    success: false,
                    message: 'Book not found'
                });
            }

            // Update image if a new one is provided
            let bookData = { ...req.body };

            if (req.file) {
                const result = await cloudinaryService.uploadBookCover(
                    req.file.buffer,
                    req.file.originalname
                );
                bookData.image = result.secure_url;
                bookData.imagePublicId = result.public_id;

                // Delete previous image from Cloudinary if it exists
                if (existingBook.imagePublicId) {
                    try {
                        await cloudinaryService.deleteFile(existingBook.imagePublicId);
                    } catch (deleteError) {
                        console.error('Error deleting old image:', deleteError);
                        // Continue with the update even if delete fails
                    }
                }
            }

            // Update book
            const book = await Book.findByIdAndUpdate(req.params.id, bookData, {
                new: true,
                runValidators: true
            }).populate('category', 'name');

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
    });
};

// @desc    Delete book
// @route   DELETE /api/books/delete/:id
// @access  Private/Admin
exports.deleteBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        // Delete image from Cloudinary if it exists
        if (book.imagePublicId) {
            try {
                await cloudinaryService.deleteFile(book.imagePublicId);
            } catch (deleteError) {
                console.error('Error deleting image:', deleteError);
                // Continue with the deletion even if image delete fails
            }
        }

        await Book.findByIdAndDelete(req.params.id);

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

// @desc    Bulk import books from Excel file
// @route   POST /api/books/import
// @access  Private/Admin
exports.bulkImportBooks = async (req, res) => {
    try {
        // Use middleware to handle file upload
        excelUpload.single('excelFile')(req, res, async function (err) {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message || 'Error uploading file'
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Please upload an Excel file'
                });
            }

            try {
                // Get default category
                const defaultCategoryId = req.body.category || null;

                if (!defaultCategoryId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Default category is required'
                    });
                }

                // Process the Excel file
                const results = await processExcelImport(req.file.path, defaultCategoryId);

                return res.status(200).json({
                    success: true,
                    message: 'Import process completed',
                    results
                });
            } catch (error) {
                console.error('Error in bulk import:', error);
                return res.status(500).json({
                    success: false,
                    message: error.message || 'Error processing file'
                });
            }
        });
    } catch (error) {
        console.error('Error in bulk import:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
}; 