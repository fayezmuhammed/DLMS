const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Configure Cloudinary with credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,  
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a file buffer to Cloudinary
 * 
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {String} folder - The folder to store the file in
 * @param {String} fileName - The name of the file
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadBuffer = (fileBuffer, folder, fileName, options = {}) => {
  return new Promise((resolve, reject) => {
    // Create a readable stream from the buffer
    const stream = Readable.from(fileBuffer);
    
    // Create upload stream to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: fileName.split('.')[0], // Use filename without extension as public_id
        resource_type: 'auto', // Auto-detect resource type (image, pdf, etc)
        ...options
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    // Pipe the file buffer stream to the upload stream
    stream.pipe(uploadStream);
  });
};

/**
 * Uploads an image to Cloudinary
 * 
 * @param {Buffer} fileBuffer - The image buffer
 * @param {String} fileName - The original file name
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadBookCover = async (fileBuffer, fileName) => {
  return uploadBuffer(fileBuffer, 'book-covers', fileName, {
    transformation: [
      { width: 800, crop: 'limit' }, // Resize to max width of 800px
      { quality: 'auto:good' }       // Optimize quality
    ]
  });
};

/**
 * Uploads an e-book file to Cloudinary
 * 
 * @param {Buffer} fileBuffer - The e-book file buffer
 * @param {String} fileName - The original file name
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadEBook = async (fileBuffer, fileName) => {
  return uploadBuffer(fileBuffer, 'e-books', fileName);
};

/**
 * Deletes a file from Cloudinary
 * 
 * @param {String} publicId - The public ID of the file
 * @param {String} resourceType - The resource type (image, raw, video)
 * @returns {Promise<Object>} - Cloudinary deletion result
 */
const deleteFile = async (publicId, resourceType = 'image') => {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

module.exports = {
  uploadBookCover,
  uploadEBook,
  deleteFile
}; 