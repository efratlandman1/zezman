const Favorite = require('../models/Favorite');
const Business = require('../models/Business');
const User = require('../models/User');
const logger = require('../../logger');

// Get all favorites
const getAllFavorites = async (req, res, next) => {
  const logSource = 'favoriteController.getAllFavorites';
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
      userId, 
      businessId, 
      sortBy = 'createdAt', 
      order = 'desc' 
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    if (userId) query.userId = userId;
    if (businessId) query.businessId = businessId;

    // Build sort
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    const favorites = await Favorite.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'firstName lastName email')
      .populate('businessId', 'name description rating images');

    const total = await Favorite.countDocuments(query);

    logger.info({ 
      ...meta, 
      favoritesCount: favorites.length,
      totalFavorites: total
    }, `${logSource} complete`);

    res.json({
      success: true,
      data: favorites,
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

// Get favorite by ID
const getFavoriteById = async (req, res, next) => {
  const logSource = 'favoriteController.getFavoriteById';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    favoriteId: req.params.id
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const favorite = await Favorite.findById(req.params.id)
      .populate('userId', 'firstName lastName email')
      .populate('businessId', 'name description rating images');

    if (!favorite) {
      return res.status(404).json({
        success: false,
        error: 'Favorite not found'
      });
    }

    logger.info({ ...meta }, `${logSource} complete`);

    res.json({
      success: true,
      data: favorite
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Add business to favorites
const addToFavorites = async (req, res, next) => {
  const logSource = 'favoriteController.addToFavorites';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    body: req.body
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const { businessId, notes } = req.body;

    // Check if business exists
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      userId: req.user._id,
      businessId: businessId
    });

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        error: 'Business is already in your favorites'
      });
    }

    const favorite = new Favorite({
      userId: req.user._id,
      businessId: businessId,
      notes: notes
    });

    await favorite.save();

    // Update business favorite count
    await business.updateStatistics();

    const populatedFavorite = await Favorite.findById(favorite._id)
      .populate('userId', 'firstName lastName email')
      .populate('businessId', 'name description rating images');

    logger.info({ 
      ...meta, 
      favoriteId: favorite._id 
    }, `${logSource} complete`);

    res.status(201).json({
      success: true,
      data: populatedFavorite
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Remove business from favorites
const removeFromFavorites = async (req, res, next) => {
  const logSource = 'favoriteController.removeFromFavorites';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    businessId: req.params.businessId
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const favorite = await Favorite.findOne({
      userId: req.user._id,
      businessId: req.params.businessId
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        error: 'Favorite not found'
      });
    }

    await Favorite.findByIdAndDelete(favorite._id);

    // Update business favorite count
    const business = await Business.findById(req.params.businessId);
    if (business) {
      await business.updateStatistics();
    }

    logger.info({ ...meta }, `${logSource} complete`);

    res.json({
      success: true,
      message: 'Business removed from favorites'
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Get user favorites
const getUserFavorites = async (req, res, next) => {
  const logSource = 'favoriteController.getUserFavorites';
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

    const favorites = await Favorite.find({ userId: req.user._id })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('businessId', 'name description rating images categoryId');

    const total = await Favorite.countDocuments({ userId: req.user._id });

    logger.info({ 
      ...meta, 
      favoritesCount: favorites.length,
      totalFavorites: total
    }, `${logSource} complete`);

    res.json({
      success: true,
      data: favorites,
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

// Check if business is favorited
const checkIfFavorited = async (req, res, next) => {
  const logSource = 'favoriteController.checkIfFavorited';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    businessId: req.params.businessId
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const favorite = await Favorite.findOne({
      userId: req.user._id,
      businessId: req.params.businessId
    });

    logger.info({ ...meta }, `${logSource} complete`);

    res.json({
      success: true,
      data: {
        isFavorited: !!favorite,
        favorite: favorite
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

// Update favorite notes
const updateFavoriteNotes = async (req, res, next) => {
  const logSource = 'favoriteController.updateFavoriteNotes';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    businessId: req.params.businessId,
    body: req.body
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const { notes } = req.body;

    const favorite = await Favorite.findOne({
      userId: req.user._id,
      businessId: req.params.businessId
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        error: 'Favorite not found'
      });
    }

    favorite.notes = notes;
    await favorite.save();

    const updatedFavorite = await Favorite.findById(favorite._id)
      .populate('userId', 'firstName lastName email')
      .populate('businessId', 'name description rating images');

    logger.info({ ...meta }, `${logSource} complete`);

    res.json({
      success: true,
      data: updatedFavorite
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Get business favorites count
const getBusinessFavoritesCount = async (req, res, next) => {
  const logSource = 'favoriteController.getBusinessFavoritesCount';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    businessId: req.params.businessId
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const count = await Favorite.countDocuments({
      businessId: req.params.businessId
    });

    logger.info({ 
      ...meta, 
      favoritesCount: count
    }, `${logSource} complete`);

    res.json({
      success: true,
      data: {
        businessId: req.params.businessId,
        favoritesCount: count
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

// Get most favorited businesses
const getMostFavoritedBusinesses = async (req, res, next) => {
  const logSource = 'favoriteController.getMostFavoritedBusinesses';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const { limit = 10 } = req.query;

    const mostFavorited = await Business.aggregate([
      { $match: { active: true, approved: true } },
      {
        $lookup: {
          from: 'favorites',
          localField: '_id',
          foreignField: 'businessId',
          as: 'favorites'
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          rating: 1,
          images: 1,
          categoryId: 1,
          favoriteCount: { $size: '$favorites' }
        }
      },
      { $sort: { favoriteCount: -1 } },
      { $limit: parseInt(limit) }
    ]);

    logger.info({ 
      ...meta, 
      businessesCount: mostFavorited.length
    }, `${logSource} complete`);

    res.json({
      success: true,
      data: mostFavorited
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Get favorite statistics
const getFavoriteStats = async (req, res, next) => {
  const logSource = 'favoriteController.getFavoriteStats';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const stats = await Favorite.aggregate([
      {
        $group: {
          _id: null,
          totalFavorites: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
          uniqueBusinesses: { $addToSet: '$businessId' }
        }
      },
      {
        $project: {
          totalFavorites: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          uniqueBusinesses: { $size: '$uniqueBusinesses' }
        }
      }
    ]);

    const result = stats[0] || {
      totalFavorites: 0,
      uniqueUsers: 0,
      uniqueBusinesses: 0
    };

    logger.info({ 
      ...meta, 
      stats: result
    }, `${logSource} complete`);

    res.json({
      success: true,
      data: result
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
  getAllFavorites,
  getFavoriteById,
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
  checkIfFavorited,
  updateFavoriteNotes,
  getBusinessFavoritesCount,
  getMostFavoritedBusinesses,
  getFavoriteStats
}; 