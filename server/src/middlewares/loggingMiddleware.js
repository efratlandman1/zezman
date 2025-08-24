const logger = require('../../logger');

/**
 * Request logging middleware
 * Logs all incoming requests with relevant information
 */
const requestLogger = (req, res, next) => {
  // Generate unique request ID
  const requestId = req.headers['x-request-id'] || 
                   req.headers['x-correlation-id'] || 
                   `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Add request ID to request object for use in other middleware
  req.requestId = requestId;
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);
  
  // Log request start
  const startTime = Date.now();
  
  logger.info({
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    userId: req.user?._id || 'anonymous',
    action: 'request_start'
  }, 'request.start');
  
  // Log response when request completes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info({
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length') || 0,
      userId: req.user?._id || 'anonymous',
      action: 'request_complete'
    }, 'request.complete');
  });
  
  // Log request errors
  res.on('error', (error) => {
    logger.error({
      requestId,
      method: req.method,
      url: req.originalUrl,
      error: error.message,
      stack: error.stack,
      userId: req.user?._id || 'anonymous',
      action: 'request_error'
    }, 'request.error');
  });
  
  next();
};

/**
 * Error logging middleware
 * Logs errors that occur during request processing
 */
const errorLogger = (error, req, res, next) => {
  logger.error({
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    error: error.message,
    stack: error.stack,
    userId: req.user?._id || 'anonymous',
    action: 'request_error'
  }, 'request.error');
  
  next(error);
};

/**
 * Performance monitoring middleware
 * Logs slow requests for performance analysis
 */
const performanceLogger = (req, res, next) => {
  const startTime = Date.now();
  const slowRequestThreshold = parseInt(process.env.SLOW_REQUEST_THRESHOLD) || 1000; // 1 second
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    if (duration > slowRequestThreshold) {
      logger.warn({
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        threshold: `${slowRequestThreshold}ms`,
        userId: req.user?._id || 'anonymous',
        action: 'slow_request'
      }, 'request.slow');
    }
  });
  
  next();
};

module.exports = {
  requestLogger,
  errorLogger,
  performanceLogger
}; 