/**
 * Blog Validators
 * 
 * Validation middleware for blog-related routes using express-validator.
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Utility to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // For API requests return JSON
    if (req.xhr || req.path.startsWith('/api/')) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    // For form submissions, render the form with errors
    if (req.method === 'POST' || req.method === 'PUT') {
      return res.render(`admin/blog/${req.body._id ? 'edit' : 'new'}`, {
        pageTitle: req.body._id ? 'Edit Blog Post' : 'Create New Blog Post',
        activePage: 'blog',
        error: errors.array()[0].msg,
        post: req.body
      });
    }
    
    // Fallback error handling
    return res.status(400).render('admin/error', {
      pageTitle: 'Validation Error',
      activePage: 'blog',
      error: errors.array()[0].msg
    });
  }
  
  next();
};

/**
 * Validation rules for creating/updating blog posts
 */
exports.validatePost = [
  // Title validation
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title cannot be more than 200 characters'),
  
  // Content validation
  body('content')
    .notEmpty().withMessage('Content is required'),
  
  // Excerpt validation
  body('excerpt')
    .trim()
    .notEmpty().withMessage('Excerpt is required')
    .isLength({ max: 500 }).withMessage('Excerpt cannot be more than 500 characters'),
  
  // Image URL validation (optional)
  body('image')
    .optional()
    .isURL().withMessage('Invalid image URL format'),
  
  // Author validation
  body('author')
    .trim()
    .notEmpty().withMessage('Author is required'),
  
  // Status validation
  body('status')
    .isIn(['draft', 'published']).withMessage('Status must be either draft or published'),
  
  // Category validation
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required'),
  
  // Tags validation (optional)
  body('tags')
    .optional()
    .custom(value => {
      // If it's an array, it's already processed
      if (Array.isArray(value)) {
        return true;
      }
      
      // If it's a string, validate comma-separated format
      if (typeof value === 'string') {
        // Empty string is valid (no tags)
        if (value.trim() === '') {
          return true;
        }
        
        // Check for proper comma-separated format
        const tags = value.split(',').map(tag => tag.trim());
        
        // Validate each tag
        for (const tag of tags) {
          if (tag.length > 50) {
            throw new Error('Each tag must be less than 50 characters');
          }
        }
        
        return true;
      }
      
      throw new Error('Tags must be a comma-separated string or an array');
    }),
  
  // SEO fields validation (optional)
  body('seo.metaTitle')
    .optional()
    .isLength({ max: 60 }).withMessage('Meta title should not exceed 60 characters'),
    
  body('seo.metaDescription')
    .optional()
    .isLength({ max: 160 }).withMessage('Meta description should not exceed 160 characters'),
  
  // Process validation errors
  handleValidationErrors
];

/**
 * Validation for post ID parameter
 */
exports.validatePostId = [
  param('id')
    .isMongoId().withMessage('Invalid post ID format'),
  
  handleValidationErrors
];

/**
 * Validation for slug parameter
 */
exports.validateSlug = [
  param('slug')
    .isString().withMessage('Invalid slug format')
    .isLength({ min: 3, max: 200 }).withMessage('Slug must be between 3 and 200 characters'),
  
  handleValidationErrors
];

/**
 * Validation for search query
 */
exports.validateSearch = [
  query('q')
    .trim()
    .notEmpty().withMessage('Search query is required'),
  
  handleValidationErrors
];

/**
 * Validation for pagination parameters
 */
exports.validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  
  handleValidationErrors
];

/**
 * Validation for category parameter
 */
exports.validateCategory = [
  param('category')
    .trim()
    .notEmpty().withMessage('Category is required'),
  
  handleValidationErrors
]; 