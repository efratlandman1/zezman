const express = require('express');
const router = express.Router();

// Import controllers
const {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  getPendingBusinesses,
  approveBusiness,
  getPendingReviews,
  moderateReview,
  getSystemStats,
  exportData
} = require('../controllers/adminController');

// Import middleware
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRoles(['admin']));

// Dashboard and statistics
router.get('/dashboard', getDashboardStats);
router.get('/system-stats', getSystemStats);

// User management
router.get('/users', getAllUsers);
router.patch('/users/:userId/role', updateUserRole);

// Business approval
router.get('/businesses/pending', getPendingBusinesses);
router.patch('/businesses/:businessId/approve', approveBusiness);

// Review moderation
router.get('/reviews/pending', getPendingReviews);
router.patch('/reviews/:reviewId/moderate', moderateReview);

// Data export
router.post('/export', exportData);

module.exports = router; 