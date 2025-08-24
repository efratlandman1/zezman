const express = require('express');
const router = express.Router();

// Import controllers
const {
  register,
  login,
  getCurrentUser,
  logout,
  refreshToken,
  changePassword,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  requestEmailVerification
} = require('../controllers/authController');

// Import middleware
const {
  authenticateToken,
  verifyPasswordChange
} = require('../middlewares/authMiddleware');

// Import validation
const {
  validateUserRegistration,
  validateUserLogin,
  validatePasswordChange
} = require('../middlewares/validationMiddleware');

// Public routes
router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);
router.post('/logout', authenticateToken, logout);
router.post('/refresh-token', authenticateToken, refreshToken);
router.post('/change-password', authenticateToken, verifyPasswordChange, validatePasswordChange, changePassword);
router.post('/request-verification', authenticateToken, requestEmailVerification);

module.exports = router; 