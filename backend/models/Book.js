const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    bookNo: {
        type: String,
        required: [true, 'Please add a book number'],
        unique: true,
        trim: true
    },
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true
    },
    author: {
        type: String,
        required: [true, 'Please add an author'],
        trim: true
    },
    isbn: {
        type: String,
        trim: true,
        validate: {
            validator: function(v) {
                // Skip validation if empty (since it's now optional)
                if (!v || v.trim() === '') return true;
                // Basic ISBN validation only if value is provided
                return v.length > 0;
            },
            message: props => `${props.value} is not a valid ISBN!`
        }
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    status: {
        type: String,
        enum: ['Available', 'Reserved', 'Issued', 'Lost'],
        default: 'Available'
    },
    copies: {
        type: Number,
        default: 1,
        min: [1, 'Number of copies must be at least 1']
    },
    publisher: {
        type: String,
        trim: true
    },
    edition: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    tags: {
        type: String,
        trim: true
    },
    image: {
        type: String
    },
    imagePublicId: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create indexes - keep unique but make it sparse to allow nulls
bookSchema.index({ isbn: 1 }, { unique: true, sparse: true });
bookSchema.index({ bookNo: 1 }, { unique: true });

const Book = mongoose.model('Book', bookSchema);

module.exports = Book; 