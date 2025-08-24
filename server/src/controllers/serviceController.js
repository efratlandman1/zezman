const Service = require('../models/Service');
const Business = require('../models/Business');
const Category = require('../models/Category');
const logger = require('../../logger');

// Get all services
const getAllServices = async (req, res, next) => {
  const logSource = 'serviceController.getAllServices';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const { active, featured, categoryId, sortBy = 'sortOrder', order = 'asc' } = req.query;
    
    // Build query
    const query = {};
    if (active !== undefined) query.active = active === 'true';
    if (featured !== undefined) query.featured = featured === 'true';
    if (categoryId) query.categoryId = categoryId;

    // Build sort
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    const services = await Service.find(query)
      .sort(sort)
      .populate('categoryId', 'name nameEn');

    logger.info({ 
      ...meta, 
      servicesCount: services.length 
    }, `${logSource} complete`);

    res.json({
      success: true,
      data: services,
      count: services.length
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Get service by ID
const getServiceById = async (req, res, next) => {
  const logSource = 'serviceController.getServiceById';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    serviceId: req.params.id
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const service = await Service.findById(req.params.id)
      .populate('categoryId', 'name nameEn');

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }

    logger.info({ ...meta }, `${logSource} complete`);

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Create new service
const createService = async (req, res, next) => {
  const logSource = 'serviceController.createService';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    body: req.body
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const service = new Service(req.body);
    await service.save();

    logger.info({ 
      ...meta, 
      serviceId: service._id 
    }, `${logSource} complete`);

    res.status(201).json({
      success: true,
      data: service
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Update service
const updateService = async (req, res, next) => {
  const logSource = 'serviceController.updateService';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    serviceId: req.params.id,
    body: req.body
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }

    logger.info({ ...meta }, `${logSource} complete`);

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Delete service
const deleteService = async (req, res, next) => {
  const logSource = 'serviceController.deleteService';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    serviceId: req.params.id
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    // Check if service is used by businesses
    const businessCount = await Business.countDocuments({
      'services.serviceId': req.params.id,
      active: true
    });

    if (businessCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete service that is used by businesses'
      });
    }

    const service = await Service.findByIdAndDelete(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }

    logger.info({ ...meta }, `${logSource} complete`);

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Get services by category
const getServicesByCategory = async (req, res, next) => {
  const logSource = 'serviceController.getServicesByCategory';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    categoryId: req.params.categoryId
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const services = await Service.find({
      categoryId: req.params.categoryId,
      active: true
    })
      .sort({ sortOrder: 1, name: 1 })
      .populate('categoryId', 'name nameEn');

    logger.info({ 
      ...meta, 
      servicesCount: services.length 
    }, `${logSource} complete`);

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Get featured services
const getFeaturedServices = async (req, res, next) => {
  const logSource = 'serviceController.getFeaturedServices';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const { limit = 10 } = req.query;

    const services = await Service.find({
      featured: true,
      active: true
    })
      .sort({ businessCount: -1, name: 1 })
      .limit(parseInt(limit))
      .populate('categoryId', 'name nameEn');

    logger.info({ 
      ...meta, 
      servicesCount: services.length 
    }, `${logSource} complete`);

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Get service statistics
const getServiceStats = async (req, res, next) => {
  const logSource = 'serviceController.getServiceStats';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const stats = await Service.aggregate([
      { $match: { active: true } },
      {
        $lookup: {
          from: 'businesses',
          localField: '_id',
          foreignField: 'services.serviceId',
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

// Search services
const searchServices = async (req, res, next) => {
  const logSource = 'serviceController.searchServices';
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

    const services = await Service.find({
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
      .limit(parseInt(limit))
      .populate('categoryId', 'name nameEn');

    logger.info({ 
      ...meta, 
      servicesCount: services.length 
    }, `${logSource} complete`);

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Get service with businesses
const getServiceWithBusinesses = async (req, res, next) => {
  const logSource = 'serviceController.getServiceWithBusinesses';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    serviceId: req.params.id
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const { page = 1, limit = 10, sortBy = 'rating', order = 'desc' } = req.query;
    const skip = (page - 1) * limit;

    const service = await Service.findById(req.params.id)
      .populate('categoryId', 'name nameEn');
    
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }

    // Build sort
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    const businesses = await Business.find({
      'services.serviceId': req.params.id,
      active: true,
      approved: true
    })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'firstName lastName');

    const total = await Business.countDocuments({
      'services.serviceId': req.params.id,
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
        service,
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

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getServicesByCategory,
  getFeaturedServices,
  getServiceStats,
  searchServices,
  getServiceWithBusinesses
}; 