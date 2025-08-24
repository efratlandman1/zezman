const express = require('express');
const router = express.Router();

// Import controllers
const {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getServicesByCategory,
  getFeaturedServices,
  getServiceStats,
  searchServices,
  getServiceWithBusinesses
} = require('../controllers/serviceController');

// Import middleware
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { validateServiceCreation, handleValidationErrors } = require('../middlewares/validationMiddleware');

// Public routes
router.get('/', getAllServices);
router.get('/featured', getFeaturedServices);
router.get('/search', searchServices);
router.get('/stats', getServiceStats);
router.get('/category/:categoryId', getServicesByCategory);
router.get('/:id', getServiceById);
router.get('/:id/businesses', getServiceWithBusinesses);

// Protected routes (admin only)
router.post('/', 
  authenticateToken, 
  authorizeRoles(['admin']), 
  validateServiceCreation, 
  createService
);

router.put('/:id', 
  authenticateToken, 
  authorizeRoles(['admin']), 
  validateServiceCreation, 
  updateService
);

router.delete('/:id', 
  authenticateToken, 
  authorizeRoles(['admin']), 
  deleteService
);

module.exports = router; 