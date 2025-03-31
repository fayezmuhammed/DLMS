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
        required: [true, 'Please add an ISBN'],
        trim: true,
        validate: {
            validator: function(v) {
                // Basic ISBN validation
                return v && v.length > 0;
            },
            message: props => `${props.value} is not a valid ISBN!`
        }
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Please add a category']
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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create indexes
bookSchema.index({ isbn: 1 }, { unique: true, sparse: true });
bookSchema.index({ bookNo: 1 }, { unique: true });

const Book = mongoose.model('Book', bookSchema);

module.exports = Book; 