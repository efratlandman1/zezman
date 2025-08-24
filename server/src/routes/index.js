const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const businessRoutes = require('./businessRoutes');
const categoryRoutes = require('./categoryRoutes');
const serviceRoutes = require('./serviceRoutes');
const reviewRoutes = require('./reviewRoutes');
const favoriteRoutes = require('./favoriteRoutes');
const suggestionRoutes = require('./suggestionRoutes');
const adminRoutes = require('./adminRoutes');

// API version prefix
const API_VERSION = '/v1';

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Zezman API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV
  });
});

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'Zezman API Documentation',
    version: '1.0.0',
    endpoints: {
      auth: `${API_VERSION}/auth`,
      businesses: `${API_VERSION}/businesses`,
      categories: `${API_VERSION}/categories`,
      services: `${API_VERSION}/services`,
      reviews: `${API_VERSION}/reviews`,
      favorites: `${API_VERSION}/favorites`,
      suggestions: `${API_VERSION}/suggestions`,
      admin: `${API_VERSION}/admin`
    },
    documentation: 'https://docs.zezman.com/api'
  });
});

// Mount route modules
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/businesses`, businessRoutes);
router.use(`${API_VERSION}/categories`, categoryRoutes);
router.use(`${API_VERSION}/services`, serviceRoutes);
router.use(`${API_VERSION}/reviews`, reviewRoutes);
router.use(`${API_VERSION}/favorites`, favoriteRoutes);
router.use(`${API_VERSION}/suggestions`, suggestionRoutes);
router.use(`${API_VERSION}/admin`, adminRoutes);

// 404 handler for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist`,
    availableRoutes: [
      '/health',
      '/docs',
      `${API_VERSION}/auth`,
      `${API_VERSION}/businesses`,
      `${API_VERSION}/categories`,
      `${API_VERSION}/services`,
      `${API_VERSION}/reviews`,
      `${API_VERSION}/favorites`,
      `${API_VERSION}/suggestions`,
      `${API_VERSION}/admin`
    ]
  });
});

module.exports = router; 