const logger = require('../../logger');

// Required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'PORT'
];

// Optional environment variables with defaults
const optionalEnvVars = {
  NODE_ENV: 'development',
  LOG_LEVEL: 'info',
  CORS_ORIGIN: 'http://localhost:3000',
  CORS_CREDENTIALS: 'true',
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX_REQUESTS: '100',
  SLOW_DOWN_WINDOW_MS: '900000',
  SLOW_DOWN_DELAY_AFTER: '50',
  SLOW_DOWN_MAX_DELAY_MS: '20000',
  BCRYPT_SALT_ROUNDS: '12',
  JWT_EXPIRES_IN: '7d',
  MAX_FILE_SIZE: '5242880',
  UPLOAD_PATH: './uploads',
  ALLOWED_FILE_TYPES: 'image/jpeg,image/png,image/webp',
  BUSINESS_APPROVAL_REQUIRED: 'true',
  REVIEW_APPROVAL_REQUIRED: 'true',
  MAX_BUSINESSES_PER_USER: '10',
  MAX_REVIEWS_PER_BUSINESS_PER_USER: '1',
  MIN_PASSWORD_LENGTH: '8',
  MAX_LOGIN_ATTEMPTS: '5',
  LOGIN_LOCKOUT_DURATION: '900000',
  ENABLE_GOOGLE_OAUTH: 'true',
  ENABLE_EMAIL_VERIFICATION: 'true',
  ENABLE_PASSWORD_RESET: 'true',
  ENABLE_FILE_UPLOAD: 'true',
  ENABLE_REDIS_CACHE: 'false',
  ENABLE_SENTRY_MONITORING: 'false'
};

// Validate environment variables
const validateEnvironment = () => {
  const missingVars = [];
  const invalidVars = [];

  // Check required variables
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  // Set optional variables with defaults
  Object.entries(optionalEnvVars).forEach(([varName, defaultValue]) => {
    if (!process.env[varName]) {
      process.env[varName] = defaultValue;
      logger.info(`Set default value for ${varName}: ${defaultValue}`);
    }
  });

  // Validate specific variables
  if (process.env.PORT && isNaN(parseInt(process.env.PORT))) {
    invalidVars.push('PORT must be a number');
  }

  if (process.env.MONGODB_URI && !process.env.MONGODB_URI.startsWith('mongodb://') && !process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
    invalidVars.push('MONGODB_URI must be a valid MongoDB connection string');
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    invalidVars.push('JWT_SECRET must be at least 32 characters long');
  }

  if (process.env.BCRYPT_SALT_ROUNDS && (isNaN(parseInt(process.env.BCRYPT_SALT_ROUNDS)) || parseInt(process.env.BCRYPT_SALT_ROUNDS) < 10)) {
    invalidVars.push('BCRYPT_SALT_ROUNDS must be a number >= 10');
  }

  // Report errors
  if (missingVars.length > 0) {
    logger.error('Missing required environment variables:', missingVars);
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  if (invalidVars.length > 0) {
    logger.error('Invalid environment variables:', invalidVars);
    throw new Error(`Invalid environment variables: ${invalidVars.join(', ')}`);
  }

  // Log successful validation
  logger.info('Environment validation completed successfully');
  
  // Log environment info (without sensitive data)
  logger.info({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    LOG_LEVEL: process.env.LOG_LEVEL,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    MONGODB_URI: process.env.MONGODB_URI ? '***configured***' : '***missing***',
    JWT_SECRET: process.env.JWT_SECRET ? '***configured***' : '***missing***'
  }, 'Environment configuration');
};

// Validate specific feature flags
const validateFeatureFlags = () => {
  const featureFlags = {
    googleOAuth: process.env.ENABLE_GOOGLE_OAUTH === 'true',
    emailVerification: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
    passwordReset: process.env.ENABLE_PASSWORD_RESET === 'true',
    fileUpload: process.env.ENABLE_FILE_UPLOAD === 'true',
    redisCache: process.env.ENABLE_REDIS_CACHE === 'true',
    sentryMonitoring: process.env.ENABLE_SENTRY_MONITORING === 'true',
    businessApproval: process.env.BUSINESS_APPROVAL_REQUIRED === 'true',
    reviewApproval: process.env.REVIEW_APPROVAL_REQUIRED === 'true'
  };

  logger.info(featureFlags, 'Feature flags configuration');
  return featureFlags;
};

// Get configuration object
const getConfig = () => {
  return {
    server: {
      port: parseInt(process.env.PORT) || 5000,
      nodeEnv: process.env.NODE_ENV || 'development',
      logLevel: process.env.LOG_LEVEL || 'info'
    },
    database: {
      uri: process.env.MONGODB_URI,
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      refreshSecret: process.env.JWT_REFRESH_SECRET,
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
    },
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: process.env.CORS_CREDENTIALS === 'true'
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
    },
    slowDown: {
      windowMs: parseInt(process.env.SLOW_DOWN_WINDOW_MS) || 15 * 60 * 1000,
      delayAfter: parseInt(process.env.SLOW_DOWN_DELAY_AFTER) || 50,
      maxDelayMs: parseInt(process.env.SLOW_DOWN_MAX_DELAY_MS) || 20000
    },
    security: {
      bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
      minPasswordLength: parseInt(process.env.MIN_PASSWORD_LENGTH) || 8,
      maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
      loginLockoutDuration: parseInt(process.env.LOGIN_LOCKOUT_DURATION) || 15 * 60 * 1000
    },
    fileUpload: {
      maxSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
      uploadPath: process.env.UPLOAD_PATH || './uploads',
      allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/webp']
    },
    business: {
      approvalRequired: process.env.BUSINESS_APPROVAL_REQUIRED === 'true',
      maxPerUser: parseInt(process.env.MAX_BUSINESSES_PER_USER) || 10
    },
    review: {
      approvalRequired: process.env.REVIEW_APPROVAL_REQUIRED === 'true',
      maxPerBusinessPerUser: parseInt(process.env.MAX_REVIEWS_PER_BUSINESS_PER_USER) || 1
    },
    features: validateFeatureFlags()
  };
};

module.exports = {
  validateEnvironment,
  validateFeatureFlags,
  getConfig
}; 