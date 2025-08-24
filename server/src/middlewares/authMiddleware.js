const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../../logger');
const { AuthenticationError, AuthorizationError } = require('./errorMiddleware');

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AuthenticationError('Access token required');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Check if user is active
    if (!user.is_verified && process.env.ENABLE_EMAIL_VERIFICATION === 'true') {
      throw new AuthenticationError('Email verification required');
    }

    // Add user to request
    req.user = user;
    
    logger.info({
      userId: user._id,
      action: 'token_authenticated'
    }, 'auth.token_authenticated');

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.warn({
        error: 'Invalid token',
        ip: req.ip
      }, 'auth.invalid_token');
      return next(new AuthenticationError('Invalid token'));
    }
    
    if (error.name === 'TokenExpiredError') {
      logger.warn({
        error: 'Token expired',
        ip: req.ip
      }, 'auth.token_expired');
      return next(new AuthenticationError('Token expired'));
    }

    logger.error({
      error: error.message,
      ip: req.ip
    }, 'auth.authentication_error');
    
    next(error);
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.is_verified) {
        req.user = user;
        
        logger.info({
          userId: user._id,
          action: 'optional_auth_success'
        }, 'auth.optional_auth_success');
      }
    }

    next();
  } catch (error) {
    // Silently continue without authentication
    logger.debug({
      error: error.message,
      action: 'optional_auth_failed'
    }, 'auth.optional_auth_failed');
    
    next();
  }
};

// Role-based authorization middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      if (!roles.includes(req.user.role)) {
        logger.warn({
          userId: req.user._id,
          userRole: req.user.role,
          requiredRoles: roles,
          action: 'unauthorized_access'
        }, 'auth.unauthorized_access');
        
        throw new AuthorizationError('Insufficient permissions');
      }

      logger.info({
        userId: req.user._id,
        userRole: req.user.role,
        action: 'authorized_access'
      }, 'auth.authorized_access');

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Admin authorization middleware
const authorizeAdmin = authorizeRoles('admin');

// Business owner authorization middleware
const authorizeBusinessOwner = authorizeRoles('admin', 'business_owner');

// Manager authorization middleware
const authorizeManager = authorizeRoles('admin', 'manager', 'business_owner');

// Business ownership verification middleware
const verifyBusinessOwnership = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    // Admins can access any business
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the business
    const Business = require('../models/Business');
    const business = await Business.findById(businessId);
    
    if (!business) {
      throw new Error('Business not found');
    }

    if (business.userId.toString() !== req.user._id.toString()) {
      logger.warn({
        userId: req.user._id,
        businessId,
        action: 'unauthorized_business_access'
      }, 'auth.unauthorized_business_access');
      
      throw new AuthorizationError('You can only manage your own businesses');
    }

    req.business = business;
    
    logger.info({
      userId: req.user._id,
      businessId,
      action: 'business_ownership_verified'
    }, 'auth.business_ownership_verified');

    next();
  } catch (error) {
    next(error);
  }
};

// Business manager verification middleware
const verifyBusinessManager = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    // Admins can access any business
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user manages the business
    const Business = require('../models/Business');
    const business = await Business.findById(businessId);
    
    if (!business) {
      throw new Error('Business not found');
    }

    // Check if user is owner or manager
    const isOwner = business.userId.toString() === req.user._id.toString();
    const isManager = business.managers.some(manager => 
      manager.userId.toString() === req.user._id.toString()
    );

    if (!isOwner && !isManager) {
      logger.warn({
        userId: req.user._id,
        businessId,
        action: 'unauthorized_business_management'
      }, 'auth.unauthorized_business_management');
      
      throw new AuthorizationError('You can only manage businesses you own or manage');
    }

    req.business = business;
    
    logger.info({
      userId: req.user._id,
      businessId,
      isOwner,
      isManager,
      action: 'business_management_verified'
    }, 'auth.business_management_verified');

    next();
  } catch (error) {
    next(error);
  }
};

// Rate limiting for authentication attempts
const authRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts',
    message: 'Please try again later'
  },
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    return req.ip;
  }
};

// Login attempt tracking
const trackLoginAttempt = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (email) {
      const user = await User.findByEmail(email);
      if (user) {
        // Track failed login attempts
        logger.warn({
          userId: user._id,
          email,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          action: 'login_attempt'
        }, 'auth.login_attempt');
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Password change verification middleware
const verifyPasswordChange = async (req, res, next) => {
  try {
    const { currentPassword } = req.body;
    
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (!currentPassword) {
      throw new Error('Current password is required');
    }

    // Verify current password
    const isPasswordValid = await req.user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      logger.warn({
        userId: req.user._id,
        action: 'invalid_password_change_attempt'
      }, 'auth.invalid_password_change_attempt');
      
      throw new Error('Current password is incorrect');
    }

    logger.info({
      userId: req.user._id,
      action: 'password_change_verified'
    }, 'auth.password_change_verified');

    next();
  } catch (error) {
    next(error);
  }
};

// Session validation middleware
const validateSession = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    // Check if user account is still active
    const user = await User.findById(req.user._id);
    if (!user || !user.is_verified) {
      logger.warn({
        userId: req.user._id,
        action: 'invalid_session'
      }, 'auth.invalid_session');
      
      return res.status(401).json({
        success: false,
        error: 'Session expired',
        message: 'Please login again'
      });
    }

    // Update last activity
    req.user.last_login = new Date();
    await req.user.save();

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  authorizeRoles,
  authorizeAdmin,
  authorizeBusinessOwner,
  authorizeManager,
  verifyBusinessOwnership,
  verifyBusinessManager,
  authRateLimit,
  trackLoginAttempt,
  verifyPasswordChange,
  validateSession
}; 