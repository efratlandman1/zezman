const pino = require('pino');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Logger configuration based on environment
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Create file stream for production
const fileStream = fs.createWriteStream(
  path.join(logsDir, `app-${new Date().toISOString().split('T')[0]}.log`),
  { flags: 'a' }
);

// Logger configuration
const loggerConfig = {
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => {
      return { level: label };
    },
    log: (object) => {
      return object;
    }
  },
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err
  },
  base: {
    pid: process.pid,
    hostname: require('os').hostname(),
    service: 'zezman-api'
  }
};

// Development configuration
if (isDevelopment) {
  loggerConfig.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname,service'
    }
  };
}

// Production configuration
if (isProduction) {
  loggerConfig.destination = fileStream;
}

// Create logger instance
const logger = pino(loggerConfig);

// Create child loggers for different contexts
const createChildLogger = (context) => {
  return logger.child({ context });
};

// Export logger and child logger factory
module.exports = logger;
module.exports.createChildLogger = createChildLogger; 