const EBook = require('../models/EBook');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configure storage for e-book files and cover images
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        if (file.fieldname === 'ebook') {
            const dir = 'public/uploads/ebooks';
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            cb(null, dir);
        } else if (file.fieldname === 'coverImage') {
            const dir = 'public/uploads/covers';
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            cb(null, dir);
        }
    },
    filename: function(req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
    }
});

// Filter allowed file types
const fileFilter = function(req, file, cb) {
    if (file.fieldname === 'ebook') {
        if (
            file.mimetype === 'application/pdf' || 
            file.mimetype === 'application/epub+zip' ||
            file.mimetype === 'application/x-mobipocket-ebook' ||
            file.mimetype === 'application/msword' ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.mimetype === 'text/plain'
        ) {
            cb(null, true);
        } else {
            cb(new Error("Unsupported file format"), false);
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

const upload = multer({ 
    storage,
    fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});

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
        const bookData = { ...req.body };
        
        // Handle file paths
        if (req.files) {
            if (req.files.ebook && req.files.ebook[0]) {
                const ebookFile = req.files.ebook[0];
                bookData.fileUrl = `/uploads/ebooks/${ebookFile.filename}`;
                bookData.fileSize = ebookFile.size;
                
                // Determine file type from extension
                const fileExtension = path.extname(ebookFile.originalname).toLowerCase().replace('.', '');
                bookData.fileType = fileExtension;
            }
            
            if (req.files.coverImage && req.files.coverImage[0]) {
                bookData.coverImage = `/uploads/covers/${req.files.coverImage[0].filename}`;
            }
        }
        
        const ebook = await EBook.create(bookData);
        
        res.status(201).json({
            success: true,
            data: ebook
        });
    } catch (error) {
        // Clean up files if there was an error
        if (req.files) {
            if (req.files.ebook && req.files.ebook[0]) {
                fs.unlinkSync(req.files.ebook[0].path);
            }
            if (req.files.coverImage && req.files.coverImage[0]) {
                fs.unlinkSync(req.files.coverImage[0].path);
            }
        }
        
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Update e-book
exports.updateEBook = async (req, res) => {
    try {
        let ebook = await EBook.findById(req.params.id);
        
        if (!ebook) {
            return res.status(404).json({
                success: false,
                message: 'E-Book not found'
            });
        }
        
        const bookData = { ...req.body };
        
        // Handle file paths and remove old files if new ones are uploaded
        if (req.files) {
            if (req.files.ebook && req.files.ebook[0]) {
                const ebookFile = req.files.ebook[0];
                
                // Remove old e-book file if exists
                if (ebook.fileUrl) {
                    const oldFilePath = path.join(__dirname, '..', 'public', ebook.fileUrl);
                    if (fs.existsSync(oldFilePath)) {
                        fs.unlinkSync(oldFilePath);
                    }
                }
                
                bookData.fileUrl = `/uploads/ebooks/${ebookFile.filename}`;
                bookData.fileSize = ebookFile.size;
                
                // Determine file type from extension
                const fileExtension = path.extname(ebookFile.originalname).toLowerCase().replace('.', '');
                bookData.fileType = fileExtension;
            }
            
            if (req.files.coverImage && req.files.coverImage[0]) {
                // Remove old cover image if exists
                if (ebook.coverImage) {
                    const oldCoverPath = path.join(__dirname, '..', 'public', ebook.coverImage);
                    if (fs.existsSync(oldCoverPath)) {
                        fs.unlinkSync(oldCoverPath);
                    }
                }
                
                bookData.coverImage = `/uploads/covers/${req.files.coverImage[0].filename}`;
            }
        }
        
        ebook = await EBook.findByIdAndUpdate(req.params.id, bookData, {
            new: true,
            runValidators: true
        });
        
        res.status(200).json({
            success: true,
            data: ebook
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
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
        
        // Remove files
        if (ebook.fileUrl) {
            const filePath = path.join(__dirname, '..', 'public', ebook.fileUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        
        if (ebook.coverImage) {
            const coverPath = path.join(__dirname, '..', 'public', ebook.coverImage);
            if (fs.existsSync(coverPath)) {
                fs.unlinkSync(coverPath);
            }
        }
        
        await ebook.remove();
        
        res.status(200).json({
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
        
        const filePath = path.join(__dirname, '..', 'public', ebook.fileUrl);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'E-Book file not found'
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
            const file = fs.createReadStream(filePath, {start, end});
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'application/pdf',
            };
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'application/pdf',
            };
            res.writeHead(200, head);
            fs.createReadStream(filePath).pipe(res);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
}; 