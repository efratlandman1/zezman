const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import configurations
const logger = require('./logger');
const sentry = require('./sentry');

// Import middleware
const { errorHandler } = require('./src/middlewares/errorMiddleware');
const { requestLogger } = require('./src/middlewares/loggingMiddleware');
const { validateEnvironment } = require('./src/config/envValidation');

// Import routes
const routes = require('./src/routes');

// Initialize Express app
const app = express();

// Validate environment variables
validateEnvironment();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "https://maps.googleapis.com"],
      connectSrc: ["'self'", "https://maps.googleapis.com"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Speed limiting
const speedLimiter = slowDown({
  windowMs: parseInt(process.env.SLOW_DOWN_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  delayAfter: parseInt(process.env.SLOW_DOWN_DELAY_AFTER) || 50, // allow 50 requests per 15 minutes, then...
  delayMs: (hits) => hits * 100, // begin adding 100ms of delay per request above 50
  maxDelayMs: parseInt(process.env.SLOW_DOWN_MAX_DELAY_MS) || 20000 // maximum delay of 20 seconds
});

// Apply rate limiting to all routes
app.use(limiter);
app.use(speedLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(requestLogger);

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Zezman API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/', routes);

// API documentation
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Zezman Business Directory API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      businesses: '/api/v1/businesses',
      users: '/api/v1/users',
      categories: '/api/v1/categories',
      services: '/api/v1/services',
      reviews: '/api/v1/reviews',
      favorites: '/api/v1/favorites',
      admin: '/api/v1/admin',
      suggestions: '/api/v1/suggestions'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Import database configuration
const { connectDB, createIndexes } = require('./src/config/database');

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });
};

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Create database indexes
    await createIndexes();
    
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      logger.info({
        action: 'server_started',
        port: PORT,
        environment: process.env.NODE_ENV
      }, 'server.startup_success');
    });
    
    return server;
  } catch (error) {
    logger.error({
      action: 'server_startup_failed',
      error: error.message
    }, 'server.startup_error');
    process.exit(1);
  }
};

// Start the server
startServer().then(serverInstance => {
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', err);
    serverInstance.close(() => process.exit(1));
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    serverInstance.close(() => process.exit(1));
  });

  // Graceful shutdown handlers
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}).catch(error => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});



module.exports = app; 