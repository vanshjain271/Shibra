/**
 * Upload Middleware - MVP
 * 
 * Handles file uploads using multer
 * Memory storage for S3 upload
 */

const multer = require('multer');

// Allowed image types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 10;

/**
 * File filter - validate image types
 */
const imageFileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

/**
 * Memory storage configuration
 * Files stored in memory buffer for S3 upload
 */
const storage = multer.memoryStorage();

/**
 * Multer instance for single image upload
 */
const uploadSingle = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
}).single('image');

/**
 * Multer instance for multiple image upload
 */
const uploadMultiple = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES
  }
}).array('images', MAX_FILES);

/**
 * Middleware wrapper for single image upload
 * Handles multer errors gracefully
 */
const handleSingleUpload = (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 5MB.'
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  });
};

/**
 * Middleware wrapper for multiple image upload
 * Handles multer errors gracefully
 */
const handleMultipleUpload = (req, res, next) => {
  uploadMultiple(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 5MB per file.'
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: `Too many files. Maximum is ${MAX_FILES} files.`
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  });
};

// Export multer instance with .single() method for compatibility
const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

module.exports = {
  upload,
  handleSingleUpload,
  handleMultipleUpload,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  MAX_FILES
};
