const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('./errorMiddleware');
const logger = require('../../logger');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const details = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));
    
    logger.warn({
      requestId: req.requestId,
      userId: req.user?._id,
      errors: details,
      url: req.originalUrl,
      method: req.method
    }, 'validation.validation_failed');
    
    const error = new ValidationError('Validation failed', details);
    return next(error);
  }
  
  next();
};

// User registration validation
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\u0590-\u05FF\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\u0590-\u05FF\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  body('nickname')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Nickname must be between 2 and 30 characters'),
  body('phonePrefix')
    .optional()
    .matches(/^\+?[0-9]{1,4}$/)
    .withMessage('Invalid phone prefix'),
  body('phone')
    .optional()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Invalid phone format'),
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Business creation validation
const validateBusinessCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('shortDescription')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Short description cannot exceed 200 characters'),
  body('address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  body('city')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  body('postalCode')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('Postal code cannot exceed 10 characters'),
  body('country')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Country cannot exceed 50 characters'),
  body('prefix')
    .matches(/^\+?[0-9]{1,4}$/)
    .withMessage('Invalid phone prefix'),
  body('phone')
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Invalid phone format'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL'),
  body('categoryId')
    .isMongoId()
    .withMessage('Invalid category ID'),
  body('location.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Coordinates must be an array with 2 elements'),
  body('location.coordinates.*')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid coordinate value'),
  handleValidationErrors
];

// Business update validation
const validateBusinessUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('shortDescription')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Short description cannot exceed 200 characters'),
  body('address')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  body('city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  body('postalCode')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('Postal code cannot exceed 10 characters'),
  body('country')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Country cannot exceed 50 characters'),
  body('prefix')
    .optional()
    .matches(/^\+?[0-9]{1,4}$/)
    .withMessage('Invalid phone prefix'),
  body('phone')
    .optional()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Invalid phone format'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL'),
  body('categoryId')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),
  body('location.coordinates')
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage('Coordinates must be an array with 2 elements'),
  body('location.coordinates.*')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid coordinate value'),
  handleValidationErrors
];

// Review creation validation
const validateReviewCreation = [
  body('businessId')
    .isMongoId()
    .withMessage('Invalid business ID'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),
  body('categories')
    .optional()
    .isArray()
    .withMessage('Categories must be an array'),
  body('categories.*')
    .optional()
    .isIn(['service', 'quality', 'price', 'atmosphere', 'cleanliness', 'staff', 'location', 'other'])
    .withMessage('Invalid category'),
  body('visitDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid visit date'),
  body('visitType')
    .optional()
    .isIn(['dine_in', 'takeaway', 'delivery', 'other'])
    .withMessage('Invalid visit type'),
  handleValidationErrors
];

// Category creation validation
const validateCategoryCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  body('nameEn')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('English category name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('descriptionEn')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('English description cannot exceed 500 characters'),
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Icon cannot exceed 200 characters'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Invalid color format (use hex color)'),
  body('parentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent category ID'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer'),
  handleValidationErrors
];

// Service creation validation
const validateServiceCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Service name must be between 2 and 100 characters'),
  body('nameEn')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('English service name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('descriptionEn')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('English description cannot exceed 500 characters'),
  body('categoryId')
    .isMongoId()
    .withMessage('Invalid category ID'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer'),
  handleValidationErrors
];

// Suggestion creation validation
const validateSuggestionCreation = [
  body('type')
    .isIn(['business', 'category', 'service', 'feature', 'bug', 'improvement', 'other'])
    .withMessage('Invalid suggestion type'),
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('submitterEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('submitterName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Submitter name must be between 2 and 100 characters'),
  body('categoryId')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),
  body('businessId')
    .optional()
    .isMongoId()
    .withMessage('Invalid business ID'),
  body('serviceId')
    .optional()
    .isMongoId()
    .withMessage('Invalid service ID'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority level'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Tag must be between 1 and 50 characters'),
  body('contactInfo.phone')
    .optional()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Invalid phone format'),
  body('contactInfo.preferredContact')
    .optional()
    .isIn(['email', 'phone'])
    .withMessage('Invalid preferred contact method'),
  handleValidationErrors
];

// Search validation
const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  query('category')
    .optional()
    .isMongoId()
    .withMessage('Invalid category ID'),
  query('minRating')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Minimum rating must be between 1 and 5'),
  query('maxDistance')
    .optional()
    .isFloat({ min: 0.1, max: 100 })
    .withMessage('Maximum distance must be between 0.1 and 100 km'),
  query('lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  query('lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  query('services')
    .optional()
    .isArray()
    .withMessage('Services must be an array'),
  query('services.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid service ID'),
  query('sort')
    .optional()
    .isIn(['relevance', 'rating', 'distance', 'name', 'newest'])
    .withMessage('Invalid sort option'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

// ID parameter validation
const validateId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

// Business ID parameter validation
const validateBusinessId = [
  param('businessId')
    .isMongoId()
    .withMessage('Invalid business ID format'),
  handleValidationErrors
];

// User ID parameter validation
const validateUserId = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  handleValidationErrors
];

// Category ID parameter validation
const validateCategoryId = [
  param('categoryId')
    .isMongoId()
    .withMessage('Invalid category ID format'),
  handleValidationErrors
];

// Service ID parameter validation
const validateServiceId = [
  param('serviceId')
    .isMongoId()
    .withMessage('Invalid service ID format'),
  handleValidationErrors
];

// Suggestion ID parameter validation
const validateSuggestionId = [
  param('suggestionId')
    .isMongoId()
    .withMessage('Invalid suggestion ID format'),
  handleValidationErrors
];

// Password change validation
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match');
      }
      return true;
    }),
  handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\u0590-\u05FF\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\u0590-\u05FF\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  body('nickname')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Nickname must be between 2 and 30 characters'),
  body('phonePrefix')
    .optional()
    .matches(/^\+?[0-9]{1,4}$/)
    .withMessage('Invalid phone prefix'),
  body('phone')
    .optional()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Invalid phone format'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('preferences.language')
    .optional()
    .isIn(['he', 'en'])
    .withMessage('Invalid language preference'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateBusinessCreation,
  validateBusinessUpdate,
  validateReviewCreation,
  validateCategoryCreation,
  validateServiceCreation,
  validateSuggestionCreation,
  validateSearch,
  validatePagination,
  validateId,
  validateBusinessId,
  validateUserId,
  validateCategoryId,
  validateServiceId,
  validateSuggestionId,
  validatePasswordChange,
  validateProfileUpdate
}; 