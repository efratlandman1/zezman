const express = require('express');
const router = express.Router();

// Import controllers
const {
  getBusinesses,
  searchBusinesses,
  getBusinessById,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  getUserBusinesses,
  getFeaturedBusinesses,
  getNearbyBusinesses,
  getBusinessStats,
  approveBusiness,
  rejectBusiness
} = require('../controllers/businessController');

// Import middleware
const {
  authenticateToken,
  optionalAuth,
  authorizeAdmin,
  verifyBusinessOwnership
} = require('../middlewares/authMiddleware');

// Import validation
const {
  validateBusinessCreation,
  validateBusinessUpdate,
  validateBusinessId,
  validateSearch,
  validatePagination
} = require('../middlewares/validationMiddleware');

// Public routes
router.get('/', optionalAuth, validatePagination, getBusinesses);
router.get('/search', optionalAuth, validateSearch, searchBusinesses);
router.get('/featured', optionalAuth, getFeaturedBusinesses);
router.get('/nearby', optionalAuth, getNearbyBusinesses);
router.get('/stats', optionalAuth, getBusinessStats);
router.get('/:businessId', optionalAuth, validateBusinessId, getBusinessById);

// Protected routes
router.post('/', authenticateToken, validateBusinessCreation, createBusiness);
router.put('/:businessId', authenticateToken, validateBusinessId, validateBusinessUpdate, verifyBusinessOwnership, updateBusiness);
router.delete('/:businessId', authenticateToken, validateBusinessId, verifyBusinessOwnership, deleteBusiness);
router.get('/user/businesses', authenticateToken, validatePagination, getUserBusinesses);

// Admin routes
router.post('/:businessId/approve', authenticateToken, authorizeAdmin, validateBusinessId, approveBusiness);
router.post('/:businessId/reject', authenticateToken, authorizeAdmin, validateBusinessId, rejectBusiness);

module.exports = router; 