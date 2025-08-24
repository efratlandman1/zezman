const express = require('express');
const router = express.Router();

// Import controllers
const {
  getAllSuggestions,
  getSuggestionById,
  createSuggestion,
  updateSuggestion,
  deleteSuggestion,
  getUserSuggestions,
  updateSuggestionStatus,
  getSuggestionsByStatus,
  getSuggestionStats
} = require('../controllers/suggestionController');

// Import middleware
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { validateSuggestionCreation, handleValidationErrors } = require('../middlewares/validationMiddleware');

// Public routes
router.get('/', getAllSuggestions);
router.get('/stats', getSuggestionStats);
router.get('/status/:status', getSuggestionsByStatus);
router.get('/:id', getSuggestionById);

// Protected routes (authenticated users)
router.post('/', 
  authenticateToken, 
  validateSuggestionCreation, 
  createSuggestion
);

router.get('/user/my-suggestions', 
  authenticateToken, 
  getUserSuggestions
);

router.put('/:id', 
  authenticateToken, 
  validateSuggestionCreation, 
  updateSuggestion
);

router.delete('/:id', 
  authenticateToken, 
  deleteSuggestion
);

// Admin routes
router.patch('/:id/status', 
  authenticateToken, 
  authorizeRoles(['admin']), 
  updateSuggestionStatus
);

module.exports = router; 