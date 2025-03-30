const mongoose = require('mongoose');

const eBookSchema = new mongoose.Schema({
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
        enum: ['Available', 'Restricted'],
        default: 'Available'
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
    coverImage: {
        type: String
    },
    // E-book specific fields
    fileUrl: {
        type: String,
        required: [true, 'Please upload the e-book file']
    },
    fileType: {
        type: String,
        enum: ['pdf', 'epub', 'mobi', 'doc', 'docx', 'txt'],
        default: 'pdf'
    },
    fileSize: {
        type: Number, // In bytes
    },
    pages: {
        type: Number
    },
    accessRestriction: {
        type: String,
        enum: ['Public', 'Members', 'Premium'],
        default: 'Members'
    },
    downloadable: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create index for ISBN
eBookSchema.index({ isbn: 1 }, { unique: true, sparse: true });

const EBook = mongoose.model('EBook', eBookSchema);

module.exports = EBook; 