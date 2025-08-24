const Suggestion = require('../models/Suggestion');
const User = require('../models/User');
const Business = require('../models/Business');
const Category = require('../models/Category');
const logger = require('../../logger');

// Get all suggestions
const getAllSuggestions = async (req, res, next) => {
  const logSource = 'suggestionController.getAllSuggestions';
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
      status, 
      type, 
      priority, 
      suggestedBy, 
      sortBy = 'createdAt', 
      order = 'desc' 
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (suggestedBy) query.suggestedBy = suggestedBy;

    // Build sort
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    const suggestions = await Suggestion.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('suggestedBy', 'firstName lastName email')
      .populate('categoryId', 'name nameEn')
      .populate('businessId', 'name')
      .populate('serviceId', 'name nameEn');

    const total = await Suggestion.countDocuments(query);

    logger.info({ 
      ...meta, 
      suggestionsCount: suggestions.length,
      totalSuggestions: total
    }, `${logSource} complete`);

    res.json({
      success: true,
      data: suggestions,
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

// Get suggestion by ID
const getSuggestionById = async (req, res, next) => {
  const logSource = 'suggestionController.getSuggestionById';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    suggestionId: req.params.id
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const suggestion = await Suggestion.findById(req.params.id)
      .populate('suggestedBy', 'firstName lastName email')
      .populate('categoryId', 'name nameEn')
      .populate('businessId', 'name')
      .populate('serviceId', 'name nameEn');

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        error: 'Suggestion not found'
      });
    }

    logger.info({ ...meta }, `${logSource} complete`);

    res.json({
      success: true,
      data: suggestion
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Create new suggestion
const createSuggestion = async (req, res, next) => {
  const logSource = 'suggestionController.createSuggestion';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    body: req.body
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const {
      type,
      title,
      description,
      categoryId,
      businessId,
      serviceId,
      priority,
      tags,
      submitterEmail,
      submitterName
    } = req.body;

    const suggestionData = {
      type,
      title,
      description,
      priority: priority || 'medium',
      tags: tags || [],
      submitterEmail,
      submitterName
    };

    // Add user info if authenticated
    if (req.user) {
      suggestionData.suggestedBy = req.user._id;
      suggestionData.submitterEmail = req.user.email;
      suggestionData.submitterName = `${req.user.firstName} ${req.user.lastName}`.trim();
    }

    // Add related entities
    if (categoryId) suggestionData.categoryId = categoryId;
    if (businessId) suggestionData.businessId = businessId;
    if (serviceId) suggestionData.serviceId = serviceId;

    const suggestion = new Suggestion(suggestionData);
    await suggestion.save();

    const populatedSuggestion = await Suggestion.findById(suggestion._id)
      .populate('suggestedBy', 'firstName lastName email')
      .populate('categoryId', 'name nameEn')
      .populate('businessId', 'name')
      .populate('serviceId', 'name nameEn');

    logger.info({ 
      ...meta, 
      suggestionId: suggestion._id 
    }, `${logSource} complete`);

    res.status(201).json({
      success: true,
      data: populatedSuggestion
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Update suggestion
const updateSuggestion = async (req, res, next) => {
  const logSource = 'suggestionController.updateSuggestion';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    suggestionId: req.params.id,
    body: req.body
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const suggestion = await Suggestion.findById(req.params.id);

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        error: 'Suggestion not found'
      });
    }

    // Only allow updates if user is admin or the original submitter
    if (req.user.role !== 'admin' && suggestion.suggestedBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this suggestion'
      });
    }

    const updatedSuggestion = await Suggestion.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('suggestedBy', 'firstName lastName email')
     .populate('categoryId', 'name nameEn')
     .populate('businessId', 'name')
     .populate('serviceId', 'name nameEn');

    logger.info({ ...meta }, `${logSource} complete`);

    res.json({
      success: true,
      data: updatedSuggestion
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Delete suggestion
const deleteSuggestion = async (req, res, next) => {
  const logSource = 'suggestionController.deleteSuggestion';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    suggestionId: req.params.id
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const suggestion = await Suggestion.findById(req.params.id);

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        error: 'Suggestion not found'
      });
    }

    // Only allow deletion if user is admin or the original submitter
    if (req.user.role !== 'admin' && suggestion.suggestedBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this suggestion'
      });
    }

    await Suggestion.findByIdAndDelete(req.params.id);

    logger.info({ ...meta }, `${logSource} complete`);

    res.json({
      success: true,
      message: 'Suggestion deleted successfully'
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Get user suggestions
const getUserSuggestions = async (req, res, next) => {
  const logSource = 'suggestionController.getUserSuggestions';
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
      status, 
      type, 
      sortBy = 'createdAt', 
      order = 'desc' 
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build query
    const query = { suggestedBy: req.user._id };
    if (status) query.status = status;
    if (type) query.type = type;

    // Build sort
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    const suggestions = await Suggestion.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('categoryId', 'name nameEn')
      .populate('businessId', 'name')
      .populate('serviceId', 'name nameEn');

    const total = await Suggestion.countDocuments(query);

    logger.info({ 
      ...meta, 
      suggestionsCount: suggestions.length,
      totalSuggestions: total
    }, `${logSource} complete`);

    res.json({
      success: true,
      data: suggestions,
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

// Admin: Update suggestion status
const updateSuggestionStatus = async (req, res, next) => {
  const logSource = 'suggestionController.updateSuggestionStatus';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    suggestionId: req.params.id,
    body: req.body
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const { status, adminResponse } = req.body;

    const suggestion = await Suggestion.findById(req.params.id);

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        error: 'Suggestion not found'
      });
    }

    suggestion.status = status;
    if (adminResponse) {
      suggestion.adminResponse = {
        response: adminResponse,
        respondedBy: req.user._id,
        respondedAt: new Date()
      };
    }

    await suggestion.save();

    const updatedSuggestion = await Suggestion.findById(suggestion._id)
      .populate('suggestedBy', 'firstName lastName email')
      .populate('categoryId', 'name nameEn')
      .populate('businessId', 'name')
      .populate('serviceId', 'name nameEn')
      .populate('adminResponse.respondedBy', 'firstName lastName');

    logger.info({ 
      ...meta, 
      newStatus: status
    }, `${logSource} complete`);

    res.json({
      success: true,
      data: updatedSuggestion
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Get suggestions by status
const getSuggestionsByStatus = async (req, res, next) => {
  const logSource = 'suggestionController.getSuggestionsByStatus';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    status: req.params.status
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

    const suggestions = await Suggestion.find({ status: req.params.status })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('suggestedBy', 'firstName lastName email')
      .populate('categoryId', 'name nameEn')
      .populate('businessId', 'name')
      .populate('serviceId', 'name nameEn');

    const total = await Suggestion.countDocuments({ status: req.params.status });

    logger.info({ 
      ...meta, 
      suggestionsCount: suggestions.length,
      totalSuggestions: total
    }, `${logSource} complete`);

    res.json({
      success: true,
      data: suggestions,
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

// Get suggestion statistics
const getSuggestionStats = async (req, res, next) => {
  const logSource = 'suggestionController.getSuggestionStats';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const stats = await Suggestion.aggregate([
      {
        $group: {
          _id: null,
          totalSuggestions: { $sum: 1 },
          pendingSuggestions: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          approvedSuggestions: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          rejectedSuggestions: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          inProgressSuggestions: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } }
        }
      }
    ]);

    const typeStats = await Suggestion.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const priorityStats = await Suggestion.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const result = {
      ...stats[0],
      byType: typeStats,
      byPriority: priorityStats
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
  getAllSuggestions,
  getSuggestionById,
  createSuggestion,
  updateSuggestion,
  deleteSuggestion,
  getUserSuggestions,
  updateSuggestionStatus,
  getSuggestionsByStatus,
  getSuggestionStats
}; 