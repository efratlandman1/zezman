const express = require('express');
const router = express.Router();

// Import controllers
const {
  getAllReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  getReviewsByBusiness,
  getReviewsByUser,
  moderateReview,
  reportReview,
  getReviewStats
} = require('../controllers/reviewController');

// Import middleware
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { validateReviewCreation, handleValidationErrors } = require('../middlewares/validationMiddleware');

// Public routes
router.get('/', getAllReviews);
router.get('/stats', getReviewStats);
router.get('/business/:businessId', getReviewsByBusiness);
router.get('/:id', getReviewById);

// Protected routes (authenticated users)
router.post('/', 
  authenticateToken, 
  validateReviewCreation, 
  createReview
);

router.get('/user/my-reviews', 
  authenticateToken, 
  getReviewsByUser
);

router.put('/:id', 
  authenticateToken, 
  validateReviewCreation, 
  updateReview
);

router.delete('/:id', 
  authenticateToken, 
  deleteReview
);

router.post('/:id/report', 
  authenticateToken, 
  reportReview
);

// Admin routes
router.patch('/:id/moderate', 
  authenticateToken, 
  authorizeRoles(['admin']), 
  moderateReview
);

module.exports = router; 