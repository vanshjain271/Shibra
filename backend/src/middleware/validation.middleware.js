/**
 * Validation Middleware - MVP
 * 
 * Input validation using express-validator
 * All validation rules defined here
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors
 * Returns 400 with error details
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  next();
};

/**
 * Auth Validations
 */
const authValidation = {
  sendOTP: [
    body('phone')
      .trim()
      .notEmpty().withMessage('Phone number is required')
      .matches(/^(?:\+91)?[6-9]\d{9}$/).withMessage('Please enter a valid 10-digit Indian phone number (with or without +91)'),
    handleValidationErrors
  ],
  
  verifyOTP: [
    body('phone')
      .trim()
      .notEmpty().withMessage('Phone number is required')
      .matches(/^(?:\+91)?[6-9]\d{9}$/).withMessage('Invalid phone number'),
    body('otp')
      .trim()
      .notEmpty().withMessage('OTP is required')
      .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
      .isNumeric().withMessage('OTP must contain only numbers'),
    handleValidationErrors
  ]
};

/**
 * User Validations
 */
const userValidation = {
  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .optional()
      .trim()
      .toLowerCase()
      .isEmail().withMessage('Please enter a valid email address'),
    body('phone')
      .optional()
      .trim()
      .matches(/^(?:\+91)?[6-9]\d{9}$/).withMessage('Please enter a valid 10-digit Indian phone number'),
    body('addresses')
      .optional()
      .isArray().withMessage('Addresses must be an array'),
    body('addresses.*.name')
      .optional()
      .trim()
      .notEmpty().withMessage('Address name is required')
      .isLength({ max: 100 }).withMessage('Name too long'),
    body('addresses.*.phone')
      .optional()
      .trim()
      .matches(/^(?:\+91)?[6-9]\d{9}$/).withMessage('Invalid phone number'),
    body('addresses.*.addressLine1')
      .optional()
      .trim()
      .notEmpty().withMessage('Address line 1 is required')
      .isLength({ max: 200 }).withMessage('Address too long'),
    body('addresses.*.addressLine2')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Address too long'),
    body('addresses.*.landmark')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Landmark too long'),
    body('addresses.*.city')
      .optional()
      .trim()
      .notEmpty().withMessage('City is required')
      .isLength({ max: 50 }).withMessage('City name too long'),
    body('addresses.*.state')
      .optional()
      .trim()
      .notEmpty().withMessage('State is required')
      .isLength({ max: 50 }).withMessage('State name too long'),
    body('addresses.*.pincode')
      .optional()
      .trim()
      .matches(/^\d{6}$/).withMessage('Invalid pincode'),
    handleValidationErrors
  ]
};

/**
 * Product Validations
 */
const productValidation = {
  getProducts: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
    query('categoryId')
      .optional()
      .isMongoId().withMessage('Invalid category ID'),
    handleValidationErrors
  ],
  
  getProductById: [
    param('productId')
      .isMongoId().withMessage('Invalid product ID'),
    handleValidationErrors
  ],
  
  createProduct: [
    body('name')
      .trim()
      .notEmpty().withMessage('Product name is required')
      .isLength({ max: 200 }).withMessage('Product name cannot exceed 200 characters'),
    body('category')
      .notEmpty().withMessage('Category is required')
      .isMongoId().withMessage('Invalid category ID'),
    body('brand')
      .optional()
      .isMongoId().withMessage('Invalid brand ID'),
    body('salePrice')
      .notEmpty().withMessage('Sale price is required')
      .isFloat({ min: 0 }).withMessage('Sale price must be a positive number'),
    body('mrp')
      .notEmpty().withMessage('MRP is required')
      .isFloat({ min: 0 }).withMessage('MRP must be a positive number'),
    body('stock')
      .optional()
      .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('minOrderQty')
      .optional()
      .isInt({ min: 1 }).withMessage('Minimum order quantity must be at least 1'),
    body('taxRate')
      .optional()
      .isFloat({ min: 0, max: 100 }).withMessage('Tax rate must be between 0 and 100'),
    body('variants')
      .optional()
      .custom((value) => {
        if (Array.isArray(value)) return true;
        if (typeof value === 'string') {
          try { return Array.isArray(JSON.parse(value)); } catch (e) { return false; }
        }
        return false;
      }).withMessage('Variants must be a valid array'),
    handleValidationErrors
  ],
  
  updateProduct: [
    param('productId')
      .isMongoId().withMessage('Invalid product ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Product name cannot exceed 200 characters'),
    body('category')
      .optional()
      .isMongoId().withMessage('Invalid category ID'),
    body('brand')
      .optional()
      .isMongoId().withMessage('Invalid brand ID'),
    body('salePrice')
      .optional()
      .isFloat({ min: 0 }).withMessage('Sale price must be a positive number'),
    body('mrp')
      .optional()
      .isFloat({ min: 0 }).withMessage('MRP must be a positive number'),
    body('variants')
      .optional()
      .custom((value) => {
        if (Array.isArray(value)) return true;
        if (typeof value === 'string') {
          try { return Array.isArray(JSON.parse(value)); } catch (e) { return false; }
        }
        return false;
      }).withMessage('Variants must be a valid array'),
    handleValidationErrors
  ],
  
  deleteProduct: [
    param('productId')
      .isMongoId().withMessage('Invalid product ID'),
    handleValidationErrors
  ]
};

/**
 * MongoDB ObjectId validation
 */
const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId().withMessage(`Invalid ${paramName}`),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  authValidation,
  userValidation,
  productValidation,
  validateObjectId
};
