const User = require('../models/User');
const Business = require('../models/Business');
const Category = require('../models/Category');
const Service = require('../models/Service');
const Feedback = require('../models/Feedback');
const Favorite = require('../models/Favorite');
const Suggestion = require('../models/Suggestion');
const logger = require('../../logger');

// Get admin dashboard statistics
const getDashboardStats = async (req, res, next) => {
  const logSource = 'adminController.getDashboardStats';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    // Get counts for all entities
    const [
      totalUsers,
      totalBusinesses,
      totalCategories,
      totalServices,
      totalReviews,
      totalFavorites,
      totalSuggestions,
      pendingBusinesses,
      pendingReviews,
      pendingSuggestions
    ] = await Promise.all([
      User.countDocuments(),
      Business.countDocuments(),
      Category.countDocuments(),
      Service.countDocuments(),
      Feedback.countDocuments(),
      Favorite.countDocuments(),
      Suggestion.countDocuments(),
      Business.countDocuments({ approved: false }),
      Feedback.countDocuments({ approved: false }),
      Suggestion.countDocuments({ status: 'pending' })
    ]);

    // Get recent activity
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName email createdAt');

    const recentBusinesses = await Business.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name description rating createdAt')
      .populate('categoryId', 'name');

    const recentReviews = await Feedback.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('rating comment createdAt')
      .populate('businessId', 'name')
      .populate('userId', 'firstName lastName');

    // Get business statistics by category
    const businessStatsByCategory = await Business.aggregate([
      { $match: { active: true, approved: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$categoryId',
          categoryName: { $first: '$category.name' },
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get user registration trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const userRegistrationTrend = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const stats = {
      overview: {
        totalUsers,
        totalBusinesses,
        totalCategories,
        totalServices,
        totalReviews,
        totalFavorites,
        totalSuggestions
      },
      pending: {
        businesses: pendingBusinesses,
        reviews: pendingReviews,
        suggestions: pendingSuggestions
      },
      recentActivity: {
        users: recentUsers,
        businesses: recentBusinesses,
        reviews: recentReviews
      },
      businessStatsByCategory,
      userRegistrationTrend
    };

    logger.info({ 
      ...meta, 
      stats: {
        totalUsers,
        totalBusinesses,
        pendingBusinesses,
        pendingReviews,
        pendingSuggestions
      }
    }, `${logSource} complete`);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res, next) => {
  const logSource = 'adminController.getAllUsers';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const { 
      page = 1, 
      limit = 20, 
      role, 
      isVerified, 
      search, 
      sortBy = 'createdAt', 
      order = 'desc' 
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    if (role) query.role = role;
    if (isVerified !== undefined) query.is_verified = isVerified === 'true';
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    const users = await User.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password');

    const total = await User.countDocuments(query);

    logger.info({ 
      ...meta, 
      usersCount: users.length,
      totalUsers: total
    }, `${logSource} complete`);

    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Update user role
const updateUserRole = async (req, res, next) => {
  const logSource = 'adminController.updateUserRole';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    targetUserId: req.params.userId,
    body: req.body
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const { role } = req.body;

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.role = role;
    await user.save();

    logger.info({ 
      ...meta, 
      newRole: role
    }, `${logSource} complete`);

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Get pending businesses for approval
const getPendingBusinesses = async (req, res, next) => {
  const logSource = 'adminController.getPendingBusinesses';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'createdAt', 
      order = 'desc' 
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build sort
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    const businesses = await Business.find({ approved: false })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'firstName lastName email')
      .populate('categoryId', 'name nameEn');

    const total = await Business.countDocuments({ approved: false });

    logger.info({ 
      ...meta, 
      businessesCount: businesses.length,
      totalPending: total
    }, `${logSource} complete`);

    res.json({
      success: true,
      data: businesses,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Approve business
const approveBusiness = async (req, res, next) => {
  const logSource = 'adminController.approveBusiness';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    businessId: req.params.businessId,
    body: req.body
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const { approved, adminNotes } = req.body;

    const business = await Business.findById(req.params.businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    business.approved = approved;
    business.adminNotes = adminNotes;
    business.approvedBy = req.user._id;
    business.approvedAt = new Date();
    await business.save();

    logger.info({ 
      ...meta, 
      approved,
      businessName: business.name
    }, `${logSource} complete`);

    res.json({
      success: true,
      data: {
        business: {
          _id: business._id,
          name: business.name,
          approved: business.approved,
          adminNotes: business.adminNotes
        }
      }
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Get pending reviews for moderation
const getPendingReviews = async (req, res, next) => {
  const logSource = 'adminController.getPendingReviews';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'createdAt', 
      order = 'desc' 
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build sort
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    const reviews = await Feedback.find({ approved: false })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'firstName lastName email')
      .populate('businessId', 'name');

    const total = await Feedback.countDocuments({ approved: false });

    logger.info({ 
      ...meta, 
      reviewsCount: reviews.length,
      totalPending: total
    }, `${logSource} complete`);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Moderate review
const moderateReview = async (req, res, next) => {
  const logSource = 'adminController.moderateReview';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    reviewId: req.params.reviewId,
    body: req.body
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const { approved, adminNotes } = req.body;

    const review = await Feedback.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    review.approved = approved;
    review.adminNotes = adminNotes;
    review.moderatedBy = req.user._id;
    review.moderatedAt = new Date();
    await review.save();

    // Update business rating if review is approved
    if (approved) {
      const business = await Business.findById(review.businessId);
      if (business) {
        await business.updateRating();
      }
    }

    logger.info({ 
      ...meta, 
      approved,
      businessId: review.businessId
    }, `${logSource} complete`);

    res.json({
      success: true,
      data: {
        review: {
          _id: review._id,
          rating: review.rating,
          approved: review.approved,
          adminNotes: review.adminNotes
        }
      }
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Get system statistics
const getSystemStats = async (req, res, next) => {
  const logSource = 'adminController.getSystemStats';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    // Get database statistics
    const dbStats = await Business.db.db.stats();

    // Get collection statistics
    const collections = ['users', 'businesses', 'categories', 'services', 'feedback', 'favorites', 'suggestions'];
    const collectionStats = {};

    for (const collection of collections) {
      try {
        const stats = await Business.db.db.collection(collection).stats();
        collectionStats[collection] = {
          count: stats.count,
          size: stats.size,
          avgObjSize: stats.avgObjSize,
          storageSize: stats.storageSize,
          indexes: stats.nindexes
        };
      } catch (error) {
        collectionStats[collection] = { error: 'Unable to get stats' };
      }
    }

    const stats = {
      database: {
        name: dbStats.db,
        collections: dbStats.collections,
        dataSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
        indexes: dbStats.indexes,
        indexSize: dbStats.indexSize
      },
      collections: collectionStats
    };

    logger.info({ 
      ...meta, 
      dbName: dbStats.db,
      collectionsCount: dbStats.collections
    }, `${logSource} complete`);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Export data
const exportData = async (req, res, next) => {
  const logSource = 'adminController.exportData';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    body: req.body
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const { entity, format = 'json', filters = {} } = req.body;

    let data;
    let filename;

    switch (entity) {
      case 'users':
        data = await User.find(filters).select('-password');
        filename = `users_${new Date().toISOString().split('T')[0]}.${format}`;
        break;
      case 'businesses':
        data = await Business.find(filters).populate('categoryId', 'name');
        filename = `businesses_${new Date().toISOString().split('T')[0]}.${format}`;
        break;
      case 'reviews':
        data = await Feedback.find(filters).populate('businessId', 'name').populate('userId', 'firstName lastName');
        filename = `reviews_${new Date().toISOString().split('T')[0]}.${format}`;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid entity type'
        });
    }

    logger.info({ 
      ...meta, 
      entity,
      format,
      recordsCount: data.length
    }, `${logSource} complete`);

    res.json({
      success: true,
      data: {
        entity,
        format,
        filename,
        recordsCount: data.length,
        data
      }
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  getPendingBusinesses,
  approveBusiness,
  getPendingReviews,
  moderateReview,
  getSystemStats,
  exportData
}; 