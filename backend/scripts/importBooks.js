const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const connectDB = require('../config/db');
const xlsx = require('xlsx');

// Import models
const Book = require('../models/Book');
const Category = require('../models/Category');

// Configure multer for Excel file upload
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    // Ensure the uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(null, `books-import-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const excelFilter = (req, file, cb) => {
  if (
    file.mimetype.includes('excel') ||
    file.mimetype.includes('spreadsheetml')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Please upload only Excel files.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: excelFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Function to process the Excel file and import books
const processExcelImport = async (filePath, defaultCategoryId) => {
  try {
    // Ensure database connection is established
    await connectDB();
    
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const booksData = xlsx.utils.sheet_to_json(worksheet);

    if (!booksData || booksData.length === 0) {
      throw new Error('No data found in the Excel file');
    }

    console.log(`Found ${booksData.length} book entries to import`);
    
    // Results tracking
    const results = {
      total: booksData.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process each book
    for (const bookData of booksData) {
      try {
        // Map Excel columns to database fields
        // Assuming Excel columns match model field names (case-insensitive)
        const book = {
          bookNo: bookData.Bookno || bookData.BookNo || bookData.bookNo || bookData.bookno,
          title: bookData.Title || bookData.title,
          author: bookData.Author || bookData.author,
          publisher: bookData.Publisher || bookData.publisher,
          edition: bookData.Edition || bookData.edition,
          description: bookData.Description || bookData.description,
          tags: bookData.Tags || bookData.tags,
          image: bookData.Image || bookData['cover image link'] || bookData.CoverImageLink,
          status: 'Available',
          copies: bookData.Copies || bookData.copies || 1
        };

        // Add ISBN if it exists
        if (bookData.ISBN || bookData.isbn) {
          book.isbn = bookData.ISBN || bookData.isbn;
        }
        
        // Add category if a default is provided
        if (defaultCategoryId) {
          book.category = defaultCategoryId;
        }

        // Handle price if it exists in the Excel
        if (bookData.Price || bookData.price) {
          book.price = bookData.Price || bookData.price;
        }

        // Validate required fields
        if (!book.bookNo || !book.title || !book.author) {
          throw new Error('Missing required fields: bookNo, title, or author');
        }

        // Check if a book with this bookNo already exists
        let existingBookQuery = { bookNo: book.bookNo };
        
        // Also check ISBN uniqueness if provided
        if (book.isbn) {
          existingBookQuery = {
            $or: [
              { bookNo: book.bookNo },
              { isbn: book.isbn }
            ]
          };
        }
        
        const existingBook = await Book.findOne(existingBookQuery);

        if (existingBook) {
          let errorMsg = 'Book already exists';
          if (book.isbn && existingBook.isbn === book.isbn) {
            errorMsg = `Book already exists with ISBN: ${book.isbn}`;
          } else if (existingBook.bookNo === book.bookNo) {
            errorMsg = `Book already exists with Book No: ${book.bookNo}`;
          }
          throw new Error(errorMsg);
        }

        // Save the new book
        await Book.create(book);
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          book: bookData,
          error: error.message
        });
        console.error(`Error importing book: ${error.message}`);
      }
    }

    // Clean up - delete the temp file
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error('Error cleaning up temp file:', error);
    }

    return results;
  } catch (error) {
    console.error('Error processing Excel file:', error);
    throw error;
  }
};

module.exports = {
  upload,
  processExcelImport
}; 