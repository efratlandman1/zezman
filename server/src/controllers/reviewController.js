const Feedback = require('../models/Feedback');
const Business = require('../models/Business');
const User = require('../models/User');
const logger = require('../../logger');

// Get all reviews
const getAllReviews = async (req, res, next) => {
  const logSource = 'reviewController.getAllReviews';
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
      businessId, 
      userId, 
      rating, 
      approved, 
      sortBy = 'createdAt', 
      order = 'desc' 
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    if (businessId) query.businessId = businessId;
    if (userId) query.userId = userId;
    if (rating) query.rating = parseInt(rating);
    if (approved !== undefined) query.approved = approved === 'true';

    // Build sort
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    const reviews = await Feedback.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'firstName lastName email')
      .populate('businessId', 'name description rating images');

    const total = await Feedback.countDocuments(query);

    logger.info({ 
      ...meta, 
      reviewsCount: reviews.length,
      totalReviews: total
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

// Get review by ID
const getReviewById = async (req, res, next) => {
  const logSource = 'reviewController.getReviewById';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    reviewId: req.params.id
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const review = await Feedback.findById(req.params.id)
      .populate('userId', 'firstName lastName email')
      .populate('businessId', 'name description rating images');

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    logger.info({ ...meta }, `${logSource} complete`);

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Create new review
const createReview = async (req, res, next) => {
  const logSource = 'reviewController.createReview';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    body: req.body
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const {
      businessId,
      rating,
      comment,
      categories,
      visitDate,
      helpfulVotes
    } = req.body;

    // Check if business exists
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    // Check if user already reviewed this business
    const existingReview = await Feedback.findOne({
      userId: req.user._id,
      businessId: businessId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: 'You have already reviewed this business'
      });
    }

    const review = new Feedback({
      userId: req.user._id,
      businessId: businessId,
      rating: rating,
      comment: comment,
      categories: categories || [],
      visitDate: visitDate,
      helpfulVotes: helpfulVotes || 0
    });

    await review.save();

    // Update business rating
    await business.updateRating();

    const populatedReview = await Feedback.findById(review._id)
      .populate('userId', 'firstName lastName email')
      .populate('businessId', 'name description rating images');

    logger.info({ 
      ...meta, 
      reviewId: review._id 
    }, `${logSource} complete`);

    res.status(201).json({
      success: true,
      data: populatedReview
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Update review
const updateReview = async (req, res, next) => {
  const logSource = 'reviewController.updateReview';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    reviewId: req.params.id,
    body: req.body
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const review = await Feedback.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    // Only allow updates if user is admin or the original reviewer
    if (req.user.role !== 'admin' && review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this review'
      });
    }

    const updatedReview = await Feedback.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email')
     .populate('businessId', 'name description rating images');

    // Update business rating if review was modified
    const business = await Business.findById(review.businessId);
    if (business) {
      await business.updateRating();
    }

    logger.info({ ...meta }, `${logSource} complete`);

    res.json({
      success: true,
      data: updatedReview
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Delete review
const deleteReview = async (req, res, next) => {
  const logSource = 'reviewController.deleteReview';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    reviewId: req.params.id
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const review = await Feedback.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    // Only allow deletion if user is admin or the original reviewer
    if (req.user.role !== 'admin' && review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this review'
      });
    }

    await Feedback.findByIdAndDelete(req.params.id);

    // Update business rating
    const business = await Business.findById(review.businessId);
    if (business) {
      await business.updateRating();
    }

    logger.info({ ...meta }, `${logSource} complete`);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Get reviews by business
const getReviewsByBusiness = async (req, res, next) => {
  const logSource = 'reviewController.getReviewsByBusiness';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    businessId: req.params.businessId
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const { 
      page = 1, 
      limit = 20, 
      rating, 
      approved = true, 
      sortBy = 'createdAt', 
      order = 'desc' 
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build query
    const query = { businessId: req.params.businessId };
    if (rating) query.rating = parseInt(rating);
    if (approved !== undefined) query.approved = approved === 'true';

    // Build sort
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    const reviews = await Feedback.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'firstName lastName email');

    const total = await Feedback.countDocuments(query);

    logger.info({ 
      ...meta, 
      reviewsCount: reviews.length,
      totalReviews: total
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

// Get reviews by user
const getReviewsByUser = async (req, res, next) => {
  const logSource = 'reviewController.getReviewsByUser';
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
      rating, 
      approved, 
      sortBy = 'createdAt', 
      order = 'desc' 
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build query
    const query = { userId: req.user._id };
    if (rating) query.rating = parseInt(rating);
    if (approved !== undefined) query.approved = approved === 'true';

    // Build sort
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;

    const reviews = await Feedback.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('businessId', 'name description rating images categoryId');

    const total = await Feedback.countDocuments(query);

    logger.info({ 
      ...meta, 
      reviewsCount: reviews.length,
      totalReviews: total
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

// Moderate review (admin only)
const moderateReview = async (req, res, next) => {
  const logSource = 'reviewController.moderateReview';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    reviewId: req.params.id,
    body: req.body
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const { approved, adminNotes } = req.body;

    const review = await Feedback.findById(req.params.id);

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

    // Update business rating if review status changed
    const business = await Business.findById(review.businessId);
    if (business) {
      await business.updateRating();
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

// Report review
const reportReview = async (req, res, next) => {
  const logSource = 'reviewController.reportReview';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId,
    reviewId: req.params.id,
    body: req.body
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const { reason, description } = req.body;

    const review = await Feedback.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    // Check if user already reported this review
    const existingReport = review.reports.find(
      report => report.reportedBy.toString() === req.user._id.toString()
    );

    if (existingReport) {
      return res.status(400).json({
        success: false,
        error: 'You have already reported this review'
      });
    }

    review.reports.push({
      reason: reason,
      description: description,
      reportedBy: req.user._id,
      reportedAt: new Date()
    });

    await review.save();

    logger.info({ 
      ...meta, 
      reason
    }, `${logSource} complete`);

    res.json({
      success: true,
      message: 'Review reported successfully'
    });
  } catch (error) {
    logger.error({ 
      ...meta, 
      error: error.message 
    }, `${logSource} error`);
    next(error);
  }
};

// Get review statistics
const getReviewStats = async (req, res, next) => {
  const logSource = 'reviewController.getReviewStats';
  const meta = {
    requestId: req.requestId,
    userId: req.user?._id,
    visitorId: req.visitorId
  };

  try {
    logger.info({ ...meta }, `${logSource} enter`);

    const stats = await Feedback.aggregate([
      { $match: { approved: true } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          totalRatings: { $sum: '$rating' },
          helpfulVotes: { $sum: '$helpfulVotes' }
        }
      }
    ]);

    const ratingDistribution = await Feedback.aggregate([
      { $match: { approved: true } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const result = {
      ...stats[0],
      ratingDistribution: ratingDistribution
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
  getAllReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  getReviewsByBusiness,
  getReviewsByUser,
  moderateReview,
  reportReview,
  getReviewStats
}; 