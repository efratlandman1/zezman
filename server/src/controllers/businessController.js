const Business = require('../models/Business');
const Category = require('../models/Category');
const Service = require('../models/Service');
const logger = require('../../logger');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { NotFoundError, AuthorizationError } = require('../middlewares/errorMiddleware');

// Get all businesses with pagination and filters
const getBusinesses = asyncHandler(async (req, res) => {
  const logSource = 'businessController.getBusinesses';
  const { page = 1, limit = 20, category, rating, city, featured, verified } = req.query;

  logger.info({
    requestId: req.requestId,
    userId: req.user?._id,
    query: req.query,
    action: 'get_businesses'
  }, `${logSource} enter`);

  // Build filter criteria
  const filter = { active: true, approved: true };
  
  if (category) filter.categoryId = category;
  if (rating) filter.rating = { $gte: parseFloat(rating) };
  if (city) filter.city = new RegExp(city, 'i');
  if (featured === 'true') filter.featured = true;
  if (verified === 'true') filter.verified = true;

  const skip = (page - 1) * limit;

  // Execute query
  const [businesses, total] = await Promise.all([
    Business.find(filter)
      .populate('categoryId', 'name nameEn')
      .populate('services.serviceId', 'name nameEn')
      .sort({ featured: -1, rating: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Business.countDocuments(filter)
  ]);

  logger.info({
    requestId: req.requestId,
    userId: req.user?._id,
    businessesCount: businesses.length,
    total,
    action: 'businesses_retrieved'
  }, `${logSource} complete`);

  res.json({
    success: true,
    data: {
      businesses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Search businesses
const searchBusinesses = asyncHandler(async (req, res) => {
  const logSource = 'businessController.searchBusinesses';
  const { q, category, minRating, maxDistance, lat, lng, services, sort = 'relevance', page = 1, limit = 20 } = req.query;

  logger.info({
    requestId: req.requestId,
    userId: req.user?._id,
    query: req.query,
    action: 'search_businesses'
  }, `${logSource} enter`);

  // Build search filters
  const filters = {};
  if (category) filters.category = category;
  if (minRating) filters.minRating = parseFloat(minRating);
  if (maxDistance && lat && lng) {
    filters.maxDistance = parseFloat(maxDistance);
    filters.lat = parseFloat(lat);
    filters.lng = parseFloat(lng);
  }
  if (services) filters.services = services.split(',');

  // Execute search
  const result = await Business.searchBusinesses(q, filters, sort, parseInt(page), parseInt(limit));

  logger.info({
    requestId: req.requestId,
    userId: req.user?._id,
    searchQuery: q,
    resultsCount: result.businesses.length,
    total: result.pagination.total,
    action: 'business_search_completed'
  }, `${logSource} complete`);

  res.json({
    success: true,
    data: result
  });
});

// Get business by ID
const getBusinessById = asyncHandler(async (req, res) => {
  const logSource = 'businessController.getBusinessById';
  const { businessId } = req.params;

  logger.info({
    requestId: req.requestId,
    userId: req.user?._id,
    businessId,
    action: 'get_business_by_id'
  }, `${logSource} enter`);

  const business = await Business.findById(businessId)
    .populate('categoryId', 'name nameEn description')
    .populate('subCategories', 'name nameEn')
    .populate('services.serviceId', 'name nameEn description')
    .populate('userId', 'firstName lastName nickname')
    .populate('managers.userId', 'firstName lastName nickname');

  if (!business) {
    logger.warn({
      requestId: req.requestId,
      userId: req.user?._id,
      businessId,
      action: 'business_not_found'
    }, `${logSource} not_found`);
    
    throw new NotFoundError('Business not found');
  }

  // Increment view count
  await business.incrementViewCount();

  logger.info({
    requestId: req.requestId,
    userId: req.user?._id,
    businessId,
    action: 'business_retrieved'
  }, `${logSource} complete`);

  res.json({
    success: true,
    data: { business }
  });
});

// Create new business
const createBusiness = asyncHandler(async (req, res) => {
  const logSource = 'businessController.createBusiness';

  logger.info({
    requestId: req.requestId,
    userId: req.user._id,
    businessData: req.body,
    action: 'create_business_attempt'
  }, `${logSource} enter`);

  // Check if user has reached business limit
  const userBusinessCount = await Business.countDocuments({ userId: req.user._id, active: true });
  const maxBusinesses = parseInt(process.env.MAX_BUSINESSES_PER_USER) || 10;
  
  if (userBusinessCount >= maxBusinesses) {
    logger.warn({
      requestId: req.requestId,
      userId: req.user._id,
      currentCount: userBusinessCount,
      maxAllowed: maxBusinesses,
      action: 'business_limit_reached'
    }, `${logSource} limit_reached`);
    
    throw new Error(`You can only create up to ${maxBusinesses} businesses`);
  }

  // Create business
  const business = new Business({
    ...req.body,
    userId: req.user._id
  });

  await business.save();

  // Populate related data
  await business.populate([
    { path: 'categoryId', select: 'name nameEn' },
    { path: 'services.serviceId', select: 'name nameEn' }
  ]);

  logger.info({
    requestId: req.requestId,
    userId: req.user._id,
    businessId: business._id,
    action: 'business_created_successfully'
  }, `${logSource} complete`);

  res.status(201).json({
    success: true,
    message: 'Business created successfully',
    data: { business }
  });
});

// Update business
const updateBusiness = asyncHandler(async (req, res) => {
  const logSource = 'businessController.updateBusiness';
  const { businessId } = req.params;

  logger.info({
    requestId: req.requestId,
    userId: req.user._id,
    businessId,
    updateData: req.body,
    action: 'update_business_attempt'
  }, `${logSource} enter`);

  const business = await Business.findById(businessId);
  if (!business) {
    logger.warn({
      requestId: req.requestId,
      userId: req.user._id,
      businessId,
      action: 'business_not_found'
    }, `${logSource} not_found`);
    
    throw new NotFoundError('Business not found');
  }

  // Check ownership or admin rights
  if (business.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    logger.warn({
      requestId: req.requestId,
      userId: req.user._id,
      businessId,
      businessOwner: business.userId,
      action: 'unauthorized_business_update'
    }, `${logSource} unauthorized`);
    
    throw new AuthorizationError('You can only update your own businesses');
  }

  // Update business
  Object.assign(business, req.body);
  await business.save();

  // Populate related data
  await business.populate([
    { path: 'categoryId', select: 'name nameEn' },
    { path: 'services.serviceId', select: 'name nameEn' }
  ]);

  logger.info({
    requestId: req.requestId,
    userId: req.user._id,
    businessId,
    action: 'business_updated_successfully'
  }, `${logSource} complete`);

  res.json({
    success: true,
    message: 'Business updated successfully',
    data: { business }
  });
});

// Delete business
const deleteBusiness = asyncHandler(async (req, res) => {
  const logSource = 'businessController.deleteBusiness';
  const { businessId } = req.params;

  logger.info({
    requestId: req.requestId,
    userId: req.user._id,
    businessId,
    action: 'delete_business_attempt'
  }, `${logSource} enter`);

  const business = await Business.findById(businessId);
  if (!business) {
    logger.warn({
      requestId: req.requestId,
      userId: req.user._id,
      businessId,
      action: 'business_not_found'
    }, `${logSource} not_found`);
    
    throw new NotFoundError('Business not found');
  }

  // Check ownership or admin rights
  if (business.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    logger.warn({
      requestId: req.requestId,
      userId: req.user._id,
      businessId,
      businessOwner: business.userId,
      action: 'unauthorized_business_delete'
    }, `${logSource} unauthorized`);
    
    throw new AuthorizationError('You can only delete your own businesses');
  }

  // Soft delete (set active to false)
  business.active = false;
  await business.save();

  logger.info({
    requestId: req.requestId,
    userId: req.user._id,
    businessId,
    action: 'business_deleted_successfully'
  }, `${logSource} complete`);

  res.json({
    success: true,
    message: 'Business deleted successfully'
  });
});

// Get user's businesses
const getUserBusinesses = asyncHandler(async (req, res) => {
  const logSource = 'businessController.getUserBusinesses';
  const { page = 1, limit = 20 } = req.query;

  logger.info({
    requestId: req.requestId,
    userId: req.user._id,
    action: 'get_user_businesses'
  }, `${logSource} enter`);

  const skip = (page - 1) * limit;

  const [businesses, total] = await Promise.all([
    Business.find({ userId: req.user._id })
      .populate('categoryId', 'name nameEn')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Business.countDocuments({ userId: req.user._id })
  ]);

  logger.info({
    requestId: req.requestId,
    userId: req.user._id,
    businessesCount: businesses.length,
    total,
    action: 'user_businesses_retrieved'
  }, `${logSource} complete`);

  res.json({
    success: true,
    data: {
      businesses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Get featured businesses
const getFeaturedBusinesses = asyncHandler(async (req, res) => {
  const logSource = 'businessController.getFeaturedBusinesses';
  const { limit = 10 } = req.query;

  logger.info({
    requestId: req.requestId,
    userId: req.user?._id,
    action: 'get_featured_businesses'
  }, `${logSource} enter`);

  const businesses = await Business.find({
    featured: true,
    active: true,
    approved: true
  })
  .populate('categoryId', 'name nameEn')
  .sort({ rating: -1, createdAt: -1 })
  .limit(parseInt(limit))
  .lean();

  logger.info({
    requestId: req.requestId,
    userId: req.user?._id,
    featuredCount: businesses.length,
    action: 'featured_businesses_retrieved'
  }, `${logSource} complete`);

  res.json({
    success: true,
    data: { businesses }
  });
});

// Get nearby businesses
const getNearbyBusinesses = asyncHandler(async (req, res) => {
  const logSource = 'businessController.getNearbyBusinesses';
  const { lat, lng, maxDistance = 10, limit = 20 } = req.query;

  logger.info({
    requestId: req.requestId,
    userId: req.user?._id,
    lat,
    lng,
    maxDistance,
    action: 'get_nearby_businesses'
  }, `${logSource} enter`);

  if (!lat || !lng) {
    throw new Error('Latitude and longitude are required');
  }

  const businesses = await Business.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        $maxDistance: parseFloat(maxDistance) * 1000 // Convert to meters
      }
    },
    active: true,
    approved: true
  })
  .populate('categoryId', 'name nameEn')
  .limit(parseInt(limit))
  .lean();

  logger.info({
    requestId: req.requestId,
    userId: req.user?._id,
    nearbyCount: businesses.length,
    action: 'nearby_businesses_retrieved'
  }, `${logSource} complete`);

  res.json({
    success: true,
    data: { businesses }
  });
});

// Get business statistics
const getBusinessStats = asyncHandler(async (req, res) => {
  const logSource = 'businessController.getBusinessStats';

  logger.info({
    requestId: req.requestId,
    userId: req.user?._id,
    action: 'get_business_stats'
  }, `${logSource} enter`);

  const stats = await Business.getBusinessStats();

  logger.info({
    requestId: req.requestId,
    userId: req.user?._id,
    stats,
    action: 'business_stats_retrieved'
  }, `${logSource} complete`);

  res.json({
    success: true,
    data: { stats }
  });
});

// Approve business (admin only)
const approveBusiness = asyncHandler(async (req, res) => {
  const logSource = 'businessController.approveBusiness';
  const { businessId } = req.params;

  logger.info({
    requestId: req.requestId,
    userId: req.user._id,
    businessId,
    action: 'approve_business_attempt'
  }, `${logSource} enter`);

  const business = await Business.findById(businessId);
  if (!business) {
    logger.warn({
      requestId: req.requestId,
      userId: req.user._id,
      businessId,
      action: 'business_not_found'
    }, `${logSource} not_found`);
    
    throw new NotFoundError('Business not found');
  }

  business.approved = true;
  await business.save();

  logger.info({
    requestId: req.requestId,
    userId: req.user._id,
    businessId,
    action: 'business_approved_successfully'
  }, `${logSource} complete`);

  res.json({
    success: true,
    message: 'Business approved successfully',
    data: { business }
  });
});

// Reject business (admin only)
const rejectBusiness = asyncHandler(async (req, res) => {
  const logSource = 'businessController.rejectBusiness';
  const { businessId } = req.params;
  const { reason } = req.body;

  logger.info({
    requestId: req.requestId,
    userId: req.user._id,
    businessId,
    reason,
    action: 'reject_business_attempt'
  }, `${logSource} enter`);

  const business = await Business.findById(businessId);
  if (!business) {
    logger.warn({
      requestId: req.requestId,
      userId: req.user._id,
      businessId,
      action: 'business_not_found'
    }, `${logSource} not_found`);
    
    throw new NotFoundError('Business not found');
  }

  business.approved = false;
  business.active = false;
  await business.save();

  // Send notification to business owner (implement notification service)
  // await sendBusinessRejectionNotification(business.userId, reason);

  logger.info({
    requestId: req.requestId,
    userId: req.user._id,
    businessId,
    reason,
    action: 'business_rejected_successfully'
  }, `${logSource} complete`);

  res.json({
    success: true,
    message: 'Business rejected successfully'
  });
});

module.exports = {
  getBusinesses,
  searchBusinesses,
  getBusinessById,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  getUserBusinesses,
  getFeaturedBusinesses,
  getNearbyBusinesses,
  getBusinessStats,
  approveBusiness,
  rejectBusiness
}; 