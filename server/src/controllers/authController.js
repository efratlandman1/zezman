const User = require('../models/User');
const logger = require('../../logger');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { AuthenticationError, ConflictError } = require('../middlewares/errorMiddleware');

// Register new user
const register = asyncHandler(async (req, res) => {
  const logSource = 'authController.register';
  const { email, password, firstName, lastName, nickname, phonePrefix, phone } = req.body;

  logger.info({
    requestId: req.requestId,
    email,
    action: 'user_registration_attempt'
  }, `${logSource} enter`);

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    logger.warn({
      requestId: req.requestId,
      email,
      action: 'user_already_exists'
    }, `${logSource} user_exists`);
    
    throw new ConflictError('User with this email already exists');
  }

  // Create new user
  const user = new User({
    email,
    password,
    firstName,
    lastName,
    nickname,
    phonePrefix,
    phone,
    authProvider: 'local'
  });

  await user.save();

  // Generate JWT token
  const token = user.generateAuthToken();

  // Update login statistics
  await user.updateLoginStats();

  logger.info({
    requestId: req.requestId,
    userId: user._id,
    email,
    action: 'user_registered_successfully'
  }, `${logSource} complete`);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        nickname: user.nickname,
        role: user.role,
        is_verified: user.is_verified,
        preferences: user.preferences
      },
      token
    }
  });
});

// Login user
const login = asyncHandler(async (req, res) => {
  const logSource = 'authController.login';
  const { email, password } = req.body;

  logger.info({
    requestId: req.requestId,
    email,
    action: 'user_login_attempt'
  }, `${logSource} enter`);

  // Find user by email
  const user = await User.findByEmail(email);
  if (!user) {
    logger.warn({
      requestId: req.requestId,
      email,
      action: 'user_not_found'
    }, `${logSource} user_not_found`);
    
    throw new AuthenticationError('Invalid email or password');
  }

  // Check if user uses local authentication
  if (user.authProvider !== 'local') {
    logger.warn({
      requestId: req.requestId,
      userId: user._id,
      email,
      authProvider: user.authProvider,
      action: 'wrong_auth_provider'
    }, `${logSource} wrong_provider`);
    
    throw new AuthenticationError(`Please login with ${user.authProvider}`);
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    logger.warn({
      requestId: req.requestId,
      userId: user._id,
      email,
      action: 'invalid_password'
    }, `${logSource} invalid_password`);
    
    throw new AuthenticationError('Invalid email or password');
  }

  // Check if user is verified
  if (!user.is_verified && process.env.ENABLE_EMAIL_VERIFICATION === 'true') {
    logger.warn({
      requestId: req.requestId,
      userId: user._id,
      email,
      action: 'email_not_verified'
    }, `${logSource} email_not_verified`);
    
    throw new AuthenticationError('Please verify your email before logging in');
  }

  // Generate JWT token
  const token = user.generateAuthToken();

  // Update login statistics
  await user.updateLoginStats();

  logger.info({
    requestId: req.requestId,
    userId: user._id,
    email,
    action: 'user_logged_in_successfully'
  }, `${logSource} complete`);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        nickname: user.nickname,
        role: user.role,
        is_verified: user.is_verified,
        preferences: user.preferences
      },
      token
    }
  });
});

// Get current user
const getCurrentUser = asyncHandler(async (req, res) => {
  const logSource = 'authController.getCurrentUser';

  logger.info({
    requestId: req.requestId,
    userId: req.user._id,
    action: 'get_current_user'
  }, `${logSource} enter`);

  // Update user statistics
  await req.user.updateStatistics();

  logger.info({
    requestId: req.requestId,
    userId: req.user._id,
    action: 'current_user_retrieved'
  }, `${logSource} complete`);

  res.json({
    success: true,
    data: {
      user: {
        _id: req.user._id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        nickname: req.user.nickname,
        role: req.user.role,
        is_verified: req.user.is_verified,
        preferences: req.user.preferences,
        total_reviews: req.user.total_reviews,
        total_favorites: req.user.total_favorites,
        total_businesses: req.user.total_businesses
      }
    }
  });
});

// Logout user
const logout = asyncHandler(async (req, res) => {
  const logSource = 'authController.logout';

  logger.info({
    requestId: req.requestId,
    userId: req.user._id,
    action: 'user_logout'
  }, `${logSource} enter`);

  // In a real application, you might want to blacklist the token
  // For now, we'll just return a success response
  // The client should remove the token from storage

  logger.info({
    requestId: req.requestId,
    userId: req.user._id,
    action: 'user_logged_out_successfully'
  }, `${logSource} complete`);

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Refresh token
const refreshToken = asyncHandler(async (req, res) => {
  const logSource = 'authController.refreshToken';

  logger.info({
    requestId: req.requestId,
    userId: req.user._id,
    action: 'token_refresh_attempt'
  }, `${logSource} enter`);

  // Generate new token
  const token = req.user.generateAuthToken();

  logger.info({
    requestId: req.requestId,
    userId: req.user._id,
    action: 'token_refreshed_successfully'
  }, `${logSource} complete`);

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      token
    }
  });
});

// Change password
const changePassword = asyncHandler(async (req, res) => {
  const logSource = 'authController.changePassword';
  const { currentPassword, newPassword } = req.body;

  logger.info({
    requestId: req.requestId,
    userId: req.user._id,
    action: 'password_change_attempt'
  }, `${logSource} enter`);

  // Verify current password
  const isPasswordValid = await req.user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    logger.warn({
      requestId: req.requestId,
      userId: req.user._id,
      action: 'invalid_current_password'
    }, `${logSource} invalid_current_password`);
    
    throw new AuthenticationError('Current password is incorrect');
  }

  // Update password
  req.user.password = newPassword;
  await req.user.save();

  logger.info({
    requestId: req.requestId,
    userId: req.user._id,
    action: 'password_changed_successfully'
  }, `${logSource} complete`);

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// Request password reset
const requestPasswordReset = asyncHandler(async (req, res) => {
  const logSource = 'authController.requestPasswordReset';
  const { email } = req.body;

  logger.info({
    requestId: req.requestId,
    email,
    action: 'password_reset_request'
  }, `${logSource} enter`);

  // Find user by email
  const user = await User.findByEmail(email);
  if (!user) {
    // Don't reveal if user exists or not for security
    logger.info({
      requestId: req.requestId,
      email,
      action: 'password_reset_email_sent'
    }, `${logSource} email_sent`);
    
    return res.json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent'
    });
  }

  // Generate reset token
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

  user.reset_password_token = resetToken;
  user.reset_password_expires = resetTokenExpiry;
  await user.save();

  // Send email (implement email service)
  // await sendPasswordResetEmail(user.email, resetToken);

  logger.info({
    requestId: req.requestId,
    userId: user._id,
    email,
    action: 'password_reset_email_sent'
  }, `${logSource} complete`);

  res.json({
    success: true,
    message: 'If an account with this email exists, a password reset link has been sent'
  });
});

// Reset password
const resetPassword = asyncHandler(async (req, res) => {
  const logSource = 'authController.resetPassword';
  const { token, newPassword } = req.body;

  logger.info({
    requestId: req.requestId,
    action: 'password_reset_attempt'
  }, `${logSource} enter`);

  // Find user by reset token
  const user = await User.findOne({
    reset_password_token: token,
    reset_password_expires: { $gt: Date.now() }
  });

  if (!user) {
    logger.warn({
      requestId: req.requestId,
      action: 'invalid_reset_token'
    }, `${logSource} invalid_token`);
    
    throw new AuthenticationError('Invalid or expired reset token');
  }

  // Update password
  user.password = newPassword;
  user.reset_password_token = undefined;
  user.reset_password_expires = undefined;
  await user.save();

  logger.info({
    requestId: req.requestId,
    userId: user._id,
    action: 'password_reset_successful'
  }, `${logSource} complete`);

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
});

// Verify email
const verifyEmail = asyncHandler(async (req, res) => {
  const logSource = 'authController.verifyEmail';
  const { token } = req.params;

  logger.info({
    requestId: req.requestId,
    action: 'email_verification_attempt'
  }, `${logSource} enter`);

  // Find user by verification token
  const user = await User.findOne({
    email_verification_token: token,
    email_verification_expires: { $gt: Date.now() }
  });

  if (!user) {
    logger.warn({
      requestId: req.requestId,
      action: 'invalid_verification_token'
    }, `${logSource} invalid_token`);
    
    throw new AuthenticationError('Invalid or expired verification token');
  }

  // Verify user
  user.is_verified = true;
  user.email_verification_token = undefined;
  user.email_verification_expires = undefined;
  await user.save();

  logger.info({
    requestId: req.requestId,
    userId: user._id,
    action: 'email_verified_successfully'
  }, `${logSource} complete`);

  res.json({
    success: true,
    message: 'Email verified successfully'
  });
});

// Request email verification
const requestEmailVerification = asyncHandler(async (req, res) => {
  const logSource = 'authController.requestEmailVerification';

  logger.info({
    requestId: req.requestId,
    userId: req.user._id,
    action: 'email_verification_request'
  }, `${logSource} enter`);

  if (req.user.is_verified) {
    logger.warn({
      requestId: req.requestId,
      userId: req.user._id,
      action: 'email_already_verified'
    }, `${logSource} already_verified`);
    
    throw new Error('Email is already verified');
  }

  // Generate verification token
  const verificationToken = require('crypto').randomBytes(32).toString('hex');
  const verificationTokenExpiry = new Date(Date.now() + 86400000); // 24 hours

  req.user.email_verification_token = verificationToken;
  req.user.email_verification_expires = verificationTokenExpiry;
  await req.user.save();

  // Send email (implement email service)
  // await sendEmailVerification(req.user.email, verificationToken);

  logger.info({
    requestId: req.requestId,
    userId: req.user._id,
    action: 'verification_email_sent'
  }, `${logSource} complete`);

  res.json({
    success: true,
    message: 'Verification email sent successfully'
  });
});

module.exports = {
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
}; 