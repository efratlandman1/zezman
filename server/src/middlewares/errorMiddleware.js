const logger = require('../../logger');
const { captureException } = require('../../sentry');

// Custom error classes
class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.details = details;
  }
}

class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}

class AuthorizationError extends Error {
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
  }
}

class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class ConflictError extends Error {
  constructor(message = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
  }
}

class RateLimitError extends Error {
  constructor(message = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
    this.statusCode = 429;
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  const errorId = req.requestId || 'unknown';
  const userId = req.user?._id || 'anonymous';
  const logSource = 'errorMiddleware.errorHandler';

  // Log error with context
  logger.error({
    errorId,
    error: err.message,
    stack: err.stack,
    requestId: req.requestId,
    userId,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  }, `${logSource} enter`);

  // Capture error in Sentry
  captureException(err, {
    tags: { errorId, requestId: req.requestId },
    user: { id: userId },
    extra: {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  // Determine error type and response
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details = null;

  // Handle different error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = err.details || err.errors;
  } else if (err.name === 'AuthenticationError') {
    statusCode = 401;
    message = 'Authentication Required';
  } else if (err.name === 'AuthorizationError') {
    statusCode = 403;
    message = 'Insufficient Permissions';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Resource Not Found';
  } else if (err.name === 'ConflictError') {
    statusCode = 409;
    message = 'Resource Conflict';
  } else if (err.name === 'RateLimitError') {
    statusCode = 429;
    message = 'Rate Limit Exceeded';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.name === 'MongoError' && err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry';
    details = Object.keys(err.keyValue).map(key => `${key} already exists`);
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    message = 'File upload error';
    details = err.message;
  } else if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
    details = null;
  }

  // Send error response
  const errorResponse = {
    success: false,
    error: message,
    errorId,
    timestamp: new Date().toISOString()
  };

  if (details) {
    errorResponse.details = details;
  }

  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);

  // Log completion
  logger.info({
    errorId,
    statusCode,
    responseTime: Date.now() - req.startTime
  }, `${logSource} complete`);
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Not found handler
const notFound = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = req.validationErrors?.() || [];
  
  if (errors.length > 0) {
    const details = errors.map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));
    
    const error = new ValidationError('Validation failed', details);
    return next(error);
  }
  
  next();
};

// Database error handler
const handleDatabaseErrors = (err, req, res, next) => {
  if (err.name === 'MongoError') {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const error = new ConflictError(`${field} already exists`);
      return next(error);
    }
  }
  
  if (err.name === 'CastError') {
    const error = new ValidationError('Invalid ID format');
    return next(error);
  }
  
  next(err);
};

// JWT error handler
const handleJWTErrors = (err, req, res, next) => {
  if (err.name === 'JsonWebTokenError') {
    const error = new AuthenticationError('Invalid token');
    return next(error);
  }
  
  if (err.name === 'TokenExpiredError') {
    const error = new AuthenticationError('Token expired');
    return next(error);
  }
  
  next(err);
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFound,
  handleValidationErrors,
  handleDatabaseErrors,
  handleJWTErrors,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError
}; 