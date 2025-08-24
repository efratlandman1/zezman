const Category = require('../models/Category');
const Business = require('../models/Business');
const logger = require('../../logger');

// Get all categories
const getAllCategories = async (req, res, next) => {
  const logSource = 'categoryController.getAllCategories';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const { active, featured, parentId, sortBy = 'sortOrder', order = 'asc' } = req.query;
    
    // Build query
    const query = {};
    if (active !== undefined) query.active = active === 'true';
    if (featured !== undefined) query.featured = featured === 'true';
    if (parentId) query.parentId = parentId;

    // Build sort
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    const categories = await Category.find(query)
      .sort(sort)
      .populate('parentId', 'name nameEn');

    logger.info({ 
      ...meta, 
      categoriesCount: categories.length 
    }, `${logSource} complete`);

    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Get category by ID
const getCategoryById = async (req, res, next) => {
  const logSource = 'categoryController.getCategoryById';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    categoryId: req.params.id
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const category = await Category.findById(req.params.id)
      .populate('parentId', 'name nameEn');

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    logger.info({ ...meta }, `${logSource} complete`);

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Create new category
const createCategory = async (req, res, next) => {
  const logSource = 'categoryController.createCategory';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    body: req.body
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const category = new Category(req.body);
    await category.save();

    logger.info({ 
      ...meta, 
      categoryId: category._id 
    }, `${logSource} complete`);

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Update category
const updateCategory = async (req, res, next) => {
  const logSource = 'categoryController.updateCategory';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    categoryId: req.params.id,
    body: req.body
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    logger.info({ ...meta }, `${logSource} complete`);

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Delete category
const deleteCategory = async (req, res, next) => {
  const logSource = 'categoryController.deleteCategory';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    categoryId: req.params.id
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    // Check if category has businesses
    const businessCount = await Business.countDocuments({ 
      categoryId: req.params.id,
      active: true 
    });

    if (businessCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete category with existing businesses'
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    logger.info({ ...meta }, `${logSource} complete`);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Get category statistics
const getCategoryStats = async (req, res, next) => {
  const logSource = 'categoryController.getCategoryStats';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const stats = await Category.aggregate([
      { $match: { active: true } },
      {
        $lookup: {
          from: 'businesses',
          localField: '_id',
          foreignField: 'categoryId',
          as: 'businesses'
        }
      },
      {
        $project: {
          name: 1,
          nameEn: 1,
          businessCount: { $size: '$businesses' },
          avgRating: { $avg: '$businesses.rating' },
          totalViews: { $sum: '$businesses.viewCount' },
          totalFavorites: { $sum: '$businesses.favoriteCount' }
        }
      },
      { $sort: { businessCount: -1 } }
    ]);

    logger.info({ 
      ...meta, 
      statsCount: stats.length 
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

// Get category with businesses
const getCategoryWithBusinesses = async (req, res, next) => {
  const logSource = 'categoryController.getCategoryWithBusinesses';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    categoryId: req.params.id
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const { page = 1, limit = 10, sortBy = 'rating', order = 'desc' } = req.query;
    const skip = (page - 1) * limit;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Build sort
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    const businesses = await Business.find({
      categoryId: req.params.id,
      active: true,
      approved: true
    })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'firstName lastName');

    const total = await Business.countDocuments({
      categoryId: req.params.id,
      active: true,
      approved: true
    });

    logger.info({ 
      ...meta, 
      businessesCount: businesses.length,
      totalBusinesses: total
    }, `${logSource} complete`);

    res.json({
      success: true,
      data: {
        category,
        businesses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
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

// Get featured categories
const getFeaturedCategories = async (req, res, next) => {
  const logSource = 'categoryController.getFeaturedCategories';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const { limit = 10 } = req.query;

    const categories = await Category.find({
      featured: true,
      active: true
    })
      .sort({ businessCount: -1, name: 1 })
      .limit(parseInt(limit));

    logger.info({ 
      ...meta, 
      categoriesCount: categories.length 
    }, `${logSource} complete`);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Search categories
const searchCategories = async (req, res, next) => {
  const logSource = 'categoryController.searchCategories';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    query: req.query.q
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const categories = await Category.find({
      $and: [
        { active: true },
        {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { nameEn: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
      .sort({ businessCount: -1, name: 1 })
      .limit(parseInt(limit));

    logger.info({ 
      ...meta, 
      categoriesCount: categories.length 
    }, `${logSource} complete`);

    res.json({
      success: true,
      data: categories
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
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats,
  getCategoryWithBusinesses,
  getFeaturedCategories,
  searchCategories
}; 