const EBook = require('../models/EBook');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cloudinaryService = require('../services/cloudinaryService');

// Configure multer to store files on disk
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Create directories if they don't exist
        const publicPath = path.join(__dirname, '..', 'public');
        const ebooksPath = path.join(publicPath, 'ebooks');
        const coversPath = path.join(publicPath, 'covers');

        if (!fs.existsSync(publicPath)) {
            fs.mkdirSync(publicPath);
        }

        if (!fs.existsSync(ebooksPath)) {
            fs.mkdirSync(ebooksPath);
        }

        if (!fs.existsSync(coversPath)) {
            fs.mkdirSync(coversPath);
        }

        // Set the destination based on file type
        if (file.fieldname === 'ebook') {
            cb(null, path.join(publicPath, 'ebooks'));
        } else if (file.fieldname === 'coverImage') {
            cb(null, path.join(publicPath, 'covers'));
        } else {
            cb(new Error('Unexpected field'));
        }
    },
    filename: function (req, file, cb) {
        // Generate a unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// Filter allowed file types
const fileFilter = function (req, file, cb) {
    if (file.fieldname === 'ebook') {
        if (
            file.mimetype === 'application/pdf' ||
            file.mimetype === 'application/epub+zip' ||
            file.mimetype === 'application/epub' ||
            file.mimetype === 'application/x-epub' ||
            file.mimetype === 'application/octet-stream' ||  // Some browsers use this for .epub files
            file.mimetype === 'application/x-mobipocket-ebook' ||
            file.mimetype === 'application/msword' ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.mimetype === 'text/plain'
        ) {
            cb(null, true);
        } else {
            cb(new Error("Unsupported file format: " + file.mimetype), false);
        }
    } else if (file.fieldname === 'coverImage') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error("Only images are allowed for cover image"), false);
        }
    } else {
        cb(new Error("Unexpected field"), false);
    }
};

// Update the upload middleware to use disk storage
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});

// Helper function to determine file type from extension and mimetype
const getFileType = (fileName, mimeType) => {
    const extension = path.extname(fileName).toLowerCase();
    if (extension === '.pdf' || mimeType === 'application/pdf') return 'pdf';
    if (extension === '.epub' || mimeType === 'application/epub+zip') return 'epub';
    if (extension === '.mobi') return 'mobi';
    return 'unknown';
};

// Get all e-books
exports.getEBooks = async (req, res) => {
    try {
        const ebooks = await EBook.find().populate('category');

        res.status(200).json({
            success: true,
            count: ebooks.length,
            data: ebooks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get single e-book
exports.getEBook = async (req, res) => {
    try {
        console.log(`[SERVER] getEBook - Looking for e-book with ID: ${req.params.id}`);

        const ebook = await EBook.findById(req.params.id).populate('category');

        if (!ebook) {
            console.log(`[SERVER] getEBook - E-book with ID ${req.params.id} not found`);
            return res.status(404).json({
                success: false,
                message: 'E-Book not found'
            });
        }

        console.log(`[SERVER] getEBook - Found e-book: ${ebook.title}`);
        res.status(200).json({
            success: true,
            data: ebook
        });
    } catch (error) {
        console.error(`[SERVER] getEBook - Error: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Upload middleware for e-book and cover image
exports.uploadEBookFiles = upload.fields([
    { name: 'ebook', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
]);

// Create new e-book
exports.createEBook = async (req, res) => {
    try {
        console.log('Creating new ebook...');

        const { title, author, description, isbn, category, language, publicationYear } = req.body;

        // Log received files
        console.log('Files received:', req.files);

        // Validate required fields
        if (!title || !author) {
            return res.status(400).json({ message: 'Title and author are required' });
        }

        // Create book data object
        const bookData = {
            title,
            author,
            description,
            isbn,
            category,
            language,
            publicationYear: publicationYear ? parseInt(publicationYear) : undefined,
        };

        // Handle cover image
        if (req.files && req.files.coverImage && req.files.coverImage[0]) {
            console.log('Cover image found:', req.files.coverImage[0].path);
            try {
                // Upload cover image to Cloudinary
                const uploadResult = await cloudinaryService.uploadImage(req.files.coverImage[0].path);
                console.log('Cloudinary upload result:', uploadResult);

                // Set cover image URL and public ID from Cloudinary
                bookData.coverImage = uploadResult.secure_url;
                bookData.coverImagePublicId = uploadResult.public_id;

                // Delete temporary local file
                fs.unlink(req.files.coverImage[0].path, (err) => {
                    if (err) console.error('Error deleting temporary cover image file:', err);
                });
            } catch (cloudinaryError) {
                console.error('Error uploading to Cloudinary:', cloudinaryError);
                // Fall back to local storage if Cloudinary fails
                bookData.coverImage = req.files.coverImage[0].path.replace(/\\/g, '/');
            }
        }

        // Handle e-book file
        if (req.files && req.files.ebook && req.files.ebook[0]) {
            const ebookFile = req.files.ebook[0];
            console.log('E-book file found:', ebookFile.path);

            // Keep e-book files local since they can be large
            bookData.fileUrl = `ebooks/${ebookFile.filename}`;
            bookData.fileSize = ebookFile.size;
            bookData.fileType = getFileType(ebookFile.originalname, ebookFile.mimetype);

            console.log(`File upload - Type: ${bookData.fileType}, Size: ${bookData.fileSize}, Path: ${bookData.fileUrl}`);
        }

        // Create the e-book in the database
        const ebook = await EBook.create(bookData);

        res.status(201).json({
            success: true,
            data: ebook
        });
    } catch (error) {
        console.error('Error creating e-book:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create e-book',
            error: error.message
        });
    }
};

// Update e-book
exports.updateEBook = async (req, res) => {
    try {
        console.log('Updating ebook...');

        const { id } = req.params;
        const { title, author, description, isbn, category, language, publicationYear } = req.body;

        // Log received files
        console.log('Files received for update:', req.files);

        // Find the e-book
        const ebook = await EBook.findById(id);
        if (!ebook) {
            return res.status(404).json({ message: 'E-book not found' });
        }

        // Create update data object
        const updateData = {
            title,
            author,
            description,
            isbn,
            category,
            language,
            publicationYear: publicationYear ? parseInt(publicationYear) : undefined,
        };

        // Handle cover image update
        if (req.files && req.files.coverImage && req.files.coverImage[0]) {
            console.log('New cover image found:', req.files.coverImage[0].path);
            try {
                // Delete old cover image from Cloudinary if it exists
                if (ebook.coverImagePublicId) {
                    try {
                        await cloudinaryService.deleteFile(ebook.coverImagePublicId);
                        console.log('Deleted old cover image from Cloudinary:', ebook.coverImagePublicId);
                    } catch (deleteError) {
                        console.error('Error deleting old cover image from Cloudinary:', deleteError);
                    }
                }

                // Upload new cover image to Cloudinary
                const uploadResult = await cloudinaryService.uploadImage(req.files.coverImage[0].path);
                console.log('Cloudinary upload result for update:', uploadResult);

                // Set cover image URL and public ID from Cloudinary
                updateData.coverImage = uploadResult.secure_url;
                updateData.coverImagePublicId = uploadResult.public_id;

                // Delete temporary local file
                fs.unlink(req.files.coverImage[0].path, (err) => {
                    if (err) console.error('Error deleting temporary cover image file:', err);
                });
            } catch (cloudinaryError) {
                console.error('Error uploading to Cloudinary during update:', cloudinaryError);
                // Fall back to local storage if Cloudinary fails
                updateData.coverImage = req.files.coverImage[0].path.replace(/\\/g, '/');
            }
        }

        // Handle e-book file update
        if (req.files && req.files.ebook && req.files.ebook[0]) {
            const ebookFile = req.files.ebook[0];
            console.log('New e-book file found:', ebookFile.path);

            // Delete old e-book file if it exists locally
            if (ebook.fileUrl && !ebook.fileUrl.startsWith('http')) {
                const oldFilePath = path.join(__dirname, '..', 'public', ebook.fileUrl);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                    console.log(`Deleted old e-book file: ${oldFilePath}`);
                }
            }

            updateData.fileUrl = `ebooks/${ebookFile.filename}`;
            updateData.fileSize = ebookFile.size;
            updateData.fileType = getFileType(ebookFile.originalname, ebookFile.mimetype);
        }

        // Update the e-book using MongoDB method
        const updatedEBook = await EBook.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        });

        res.json({
            success: true,
            data: updatedEBook
        });
    } catch (error) {
        console.error('Error updating e-book:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update e-book',
            error: error.message
        });
    }
};

// Delete e-book
exports.deleteEBook = async (req, res) => {
    try {
        const ebook = await EBook.findById(req.params.id);

        if (!ebook) {
            return res.status(404).json({
                success: false,
                message: 'E-Book not found'
            });
        }

        // Delete local files
        if (ebook.fileUrl && !ebook.fileUrl.startsWith('http')) {
            const filePath = path.join(__dirname, '..', 'public', ebook.fileUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        if (ebook.coverImage && !ebook.coverImage.startsWith('http')) {
            const coverPath = path.join(__dirname, '..', 'public', ebook.coverImage);
            if (fs.existsSync(coverPath)) {
                fs.unlinkSync(coverPath);
            }
        }

        // Delete Cloudinary files if they exist (for backward compatibility)
        if (ebook.filePublicId) {
            try {
                await cloudinaryService.deleteFile(ebook.filePublicId, 'raw');
            } catch (cloudinaryError) {
                console.error('Error deleting file from Cloudinary:', cloudinaryError);
            }
        }

        if (ebook.coverImagePublicId) {
            try {
                await cloudinaryService.deleteFile(ebook.coverImagePublicId);
            } catch (cloudinaryError) {
                console.error('Error deleting cover from Cloudinary:', cloudinaryError);
            }
        }

        // Delete e-book from database
        await ebook.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Download e-book
exports.downloadEBook = async (req, res) => {
    try {
        const ebook = await EBook.findById(req.params.id);

        if (!ebook) {
            return res.status(404).json({
                success: false,
                message: 'E-Book not found'
            });
        }

        // Check if downloadable
        if (!ebook.downloadable) {
            return res.status(403).json({
                success: false,
                message: 'This e-book is not available for download'
            });
        }

        // Check access restrictions (implement your auth logic here)
        if (ebook.accessRestriction !== 'Public') {
            // Example: Check if user is logged in for 'Members' access
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required to download this e-book'
                });
            }

            // Example: Check for 'Premium' access
            if (ebook.accessRestriction === 'Premium' && req.user.role !== 'premium') {
                return res.status(403).json({
                    success: false,
                    message: 'Premium membership required to download this e-book'
                });
            }
        }

        const filePath = path.join(__dirname, '..', 'public', ebook.fileUrl);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'E-Book file not found'
            });
        }

        res.download(filePath, `${ebook.title}.${ebook.fileType}`);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// View e-book
exports.viewEBook = async (req, res) => {
    try {
        const ebook = await EBook.findById(req.params.id);

        if (!ebook) {
            return res.status(404).json({
                success: false,
                message: 'E-Book not found'
            });
        }

        // Check access restrictions
        if (ebook.accessRestriction !== 'Public') {
            // If not public, check if user is logged in
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required to view this e-book'
                });
            }

            // Check for Premium access
            if (ebook.accessRestriction === 'Premium' && req.user.role !== 'premium') {
                return res.status(403).json({
                    success: false,
                    message: 'Premium membership required to view this e-book'
                });
            }
        }

        // Check if file type is supported for in-browser viewing
        if (ebook.fileType !== 'pdf' && ebook.fileType !== 'epub') {
            return res.status(400).json({
                success: false,
                message: 'This file format does not support in-browser preview'
            });
        }

        // Handle URLs - prefer local files but support Cloudinary URLs for backward compatibility
        if (ebook.fileUrl && ebook.fileUrl.startsWith('http')) {
            // Handle Cloudinary URLs (keeping existing code)
            const https = require('https');
            const http = require('http');

            console.log('Streaming e-book from Cloudinary URL:', ebook.fileUrl);

            // Choose http or https module based on URL
            const requester = ebook.fileUrl.startsWith('https') ? https : http;

            // Set appropriate content type
            const contentType = ebook.fileType === 'pdf' ? 'application/pdf' : 'application/epub+zip';

            // Make a request to the Cloudinary URL
            requester.get(ebook.fileUrl, (response) => {
                // Check if the remote file was found
                if (response.statusCode === 404) {
                    return res.status(404).json({
                        success: false,
                        message: 'E-Book file not found on storage server'
                    });
                }

                // Set headers for inline display
                res.setHeader('Content-Type', contentType);
                res.setHeader('Content-Disposition', 'inline');

                // Pipe the response from Cloudinary to our response
                response.pipe(res);
            }).on('error', (err) => {
                console.error('Error fetching file from Cloudinary:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error streaming file from storage'
                });
            });
        } else if (ebook.fileUrl) {
            // Handle local file
            const filePath = path.join(__dirname, '..', 'public', ebook.fileUrl);

            console.log('Checking for local file at:', filePath);

            if (!fs.existsSync(filePath)) {
                console.error('Local file not found at path:', filePath);
                return res.status(404).json({
                    success: false,
                    message: 'E-Book file not found on server'
                });
            }

            // Stream the file instead of downloading it
            const stat = fs.statSync(filePath);
            const fileSize = stat.size;
            const range = req.headers.range;

            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunksize = (end - start) + 1;
                const file = fs.createReadStream(filePath, { start, end });
                const head = {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': ebook.fileType === 'pdf' ? 'application/pdf' : 'application/epub+zip',
                };
                res.writeHead(206, head);
                file.pipe(res);
            } else {
                const head = {
                    'Content-Length': fileSize,
                    'Content-Type': ebook.fileType === 'pdf' ? 'application/pdf' : 'application/epub+zip',
                };
                res.writeHead(200, head);
                fs.createReadStream(filePath).pipe(res);
            }
        } else {
            // No file URL available
            console.error('E-book has no fileUrl:', ebook);
            return res.status(404).json({
                success: false,
                message: 'E-Book file URL not found in database'
            });
        }
    } catch (error) {
        console.error('Error in viewEBook:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
}; 