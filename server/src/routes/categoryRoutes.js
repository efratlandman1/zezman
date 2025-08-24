const express = require('express');
const router = express.Router();

// Import controllers
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats,
  getCategoryWithBusinesses,
  getFeaturedCategories,
  searchCategories
} = require('../controllers/categoryController');

// Import middleware
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { validateCategoryCreation, handleValidationErrors } = require('../middlewares/validationMiddleware');

// Public routes
router.get('/', getAllCategories);
router.get('/featured', getFeaturedCategories);
router.get('/search', searchCategories);
router.get('/stats', getCategoryStats);
router.get('/:id', getCategoryById);
router.get('/:id/businesses', getCategoryWithBusinesses);

// Protected routes (admin only)
router.post('/', 
  authenticateToken, 
  authorizeRoles(['admin']), 
  validateCategoryCreation, 
  createCategory
);

router.put('/:id', 
  authenticateToken, 
  authorizeRoles(['admin']), 
  validateCategoryCreation, 
  updateCategory
);

router.delete('/:id', 
  authenticateToken, 
  authorizeRoles(['admin']), 
  deleteCategory
);

module.exports = router; 