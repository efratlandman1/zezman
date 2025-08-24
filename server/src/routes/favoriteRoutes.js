const express = require('express');
const router = express.Router();

// Import controllers
const {
  getAllFavorites,
  getFavoriteById,
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
  checkIfFavorited,
  updateFavoriteNotes,
  getBusinessFavoritesCount,
  getMostFavoritedBusinesses,
  getFavoriteStats
} = require('../controllers/favoriteController');

// Import middleware
const { authenticateToken } = require('../middlewares/authMiddleware');
const { validateBusinessId, handleValidationErrors } = require('../middlewares/validationMiddleware');

// Public routes
router.get('/', getAllFavorites);
router.get('/stats', getFavoriteStats);
router.get('/most-favorited', getMostFavoritedBusinesses);
router.get('/business/:businessId/count', getBusinessFavoritesCount);
router.get('/:id', getFavoriteById);

// Protected routes (authenticated users)
router.post('/', 
  authenticateToken, 
  addToFavorites
);

router.get('/user/my-favorites', 
  authenticateToken, 
  getUserFavorites
);

router.get('/business/:businessId/check', 
  authenticateToken, 
  checkIfFavorited
);

router.put('/business/:businessId/notes', 
  authenticateToken, 
  updateFavoriteNotes
);

router.delete('/business/:businessId', 
  authenticateToken, 
  removeFromFavorites
);

module.exports = router; 