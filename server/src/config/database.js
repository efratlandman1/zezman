const mongoose = require('mongoose');
const logger = require('../../logger');

// Database connection options
const dbOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    logger.info({
      action: 'database_connection_attempt',
      uri: mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') // Hide credentials in logs
    }, 'database.connection_attempt');

    const conn = await mongoose.connect(mongoURI, dbOptions);

    logger.info({
      action: 'database_connected_successfully',
      host: conn.connection.host,
      port: conn.connection.port,
      name: conn.connection.name
    }, 'database.connection_success');

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error({
        action: 'database_connection_error',
        error: err.message
      }, 'database.connection_error');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn({
        action: 'database_disconnected'
      }, 'database.disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info({
        action: 'database_reconnected'
      }, 'database.reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info({
          action: 'database_connection_closed'
        }, 'database.connection_closed');
        process.exit(0);
      } catch (err) {
        logger.error({
          action: 'database_shutdown_error',
          error: err.message
        }, 'database.shutdown_error');
        process.exit(1);
      }
    });

    return conn;
  } catch (error) {
    logger.error({
      action: 'database_connection_failed',
      error: error.message,
      stack: error.stack
    }, 'database.connection_failed');
    
    throw error;
  }
};

// Test database connection
const testConnection = async () => {
  try {
    const conn = await mongoose.connection;
    const adminDb = conn.db.admin();
    const result = await adminDb.ping();
    
    logger.info({
      action: 'database_ping_successful',
      result: result
    }, 'database.ping_success');
    
    return true;
  } catch (error) {
    logger.error({
      action: 'database_ping_failed',
      error: error.message
    }, 'database.ping_failed');
    
    return false;
  }
};

// Get database statistics
const getDatabaseStats = async () => {
  try {
    const conn = await mongoose.connection;
    const stats = await conn.db.stats();
    
    return {
      collections: stats.collections,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      indexSize: stats.indexSize
    };
  } catch (error) {
    logger.error({
      action: 'database_stats_error',
      error: error.message
    }, 'database.stats_error');
    
    throw error;
  }
};

// Create indexes for all models
const createIndexes = async () => {
  try {
    logger.info({
      action: 'creating_database_indexes'
    }, 'database.create_indexes_start');

    // Import all models to ensure they are registered
    require('../models/User');
    require('../models/Business');
    require('../models/Category');
    require('../models/Service');
    require('../models/Feedback');
    require('../models/Favorite');
    require('../models/Suggestion');

    // Create indexes for all models with error handling
    const indexPromises = [
      mongoose.model('User').createIndexes().catch(err => {
        if (err.message.includes('existing index')) {
          logger.info('User indexes already exist, skipping...');
        } else {
          throw err;
        }
      }),
      mongoose.model('Business').createIndexes().catch(err => {
        if (err.message.includes('existing index')) {
          logger.info('Business indexes already exist, skipping...');
        } else {
          throw err;
        }
      }),
      mongoose.model('Category').createIndexes().catch(err => {
        if (err.message.includes('existing index')) {
          logger.info('Category indexes already exist, skipping...');
        } else {
          throw err;
        }
      }),
      mongoose.model('Service').createIndexes().catch(err => {
        if (err.message.includes('existing index')) {
          logger.info('Service indexes already exist, skipping...');
        } else {
          throw err;
        }
      }),
      mongoose.model('Feedback').createIndexes().catch(err => {
        if (err.message.includes('existing index')) {
          logger.info('Feedback indexes already exist, skipping...');
        } else {
          throw err;
        }
      }),
      mongoose.model('Favorite').createIndexes().catch(err => {
        if (err.message.includes('existing index')) {
          logger.info('Favorite indexes already exist, skipping...');
        } else {
          throw err;
        }
      }),
      mongoose.model('Suggestion').createIndexes().catch(err => {
        if (err.message.includes('existing index')) {
          logger.info('Suggestion indexes already exist, skipping...');
        } else {
          throw err;
        }
      })
    ];

    await Promise.all(indexPromises);

    logger.info({
      action: 'database_indexes_created_successfully'
    }, 'database.create_indexes_success');
  } catch (error) {
    logger.error({
      action: 'database_indexes_creation_failed',
      error: error.message
    }, 'database.create_indexes_error');
    
    throw error;
  }
};

module.exports = {
  connectDB,
  testConnection,
  getDatabaseStats,
  createIndexes
}; 