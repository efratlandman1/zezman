const mongoose = require('mongoose');
const logger = require('../../logger');

const feedbackSchema = new mongoose.Schema({
  // User & Business
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: [true, 'Business is required']
  },
  
  // Review Content
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    trim: true
  },
  
  // Review Categories (optional)
  categories: [{
    type: String,
    enum: ['service', 'quality', 'price', 'atmosphere', 'cleanliness', 'staff', 'location', 'other']
  }],
  
  // Additional Information
  visitDate: {
    type: Date
  },
  visitType: {
    type: String,
    enum: ['dine_in', 'takeaway', 'delivery', 'other'],
    default: 'other'
  },
  
  // Status & Moderation
  approved: {
    type: Boolean,
    default: false
  },
  reported: {
    type: Boolean,
    default: false
  },
  reportReason: {
    type: String,
    enum: ['inappropriate', 'spam', 'fake', 'offensive', 'other']
  },
  reportDetails: {
    type: String,
    maxlength: [500, 'Report details cannot exceed 500 characters']
  },
  
  // Engagement
  helpfulVotes: {
    type: Number,
    default: 0
  },
  totalVotes: {
    type: Number,
    default: 0
  },
  
  // Business Response
  businessResponse: {
    comment: {
      type: String,
      maxlength: [1000, 'Business response cannot exceed 1000 characters'],
      trim: true
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: {
      type: Date
    }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
feedbackSchema.index({ businessId: 1, approved: 1, createdAt: -1 });
feedbackSchema.index({ userId: 1, businessId: 1 }, { unique: true });
feedbackSchema.index({ approved: 1 });
feedbackSchema.index({ rating: 1, approved: 1 });
feedbackSchema.index({ reported: 1, approved: 1 });
feedbackSchema.index({ createdAt: -1 });

// Virtual for helpful percentage
feedbackSchema.virtual('helpfulPercentage').get(function() {
  if (this.totalVotes === 0) return 0;
  return Math.round((this.helpfulVotes / this.totalVotes) * 100);
});

// Virtual for user
feedbackSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for business
feedbackSchema.virtual('business', {
  ref: 'Business',
  localField: 'businessId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to update timestamps
feedbackSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Pre-save middleware to update business rating when review is approved
feedbackSchema.pre('save', async function(next) {
  try {
    // Only update if the approval status changed
    if (this.isModified('approved')) {
      const business = await this.model('Business').findById(this.businessId);
      if (business) {
        await business.updateRating();
      }
    }
    next();
  } catch (error) {
    logger.error({
      feedbackId: this._id,
      businessId: this.businessId,
      error: error.message
    }, 'feedback.business_rating_update_error');
    next(error);
  }
});

// Instance method to mark as helpful
feedbackSchema.methods.markHelpful = async function() {
  try {
    this.helpfulVotes += 1;
    this.totalVotes += 1;
    await this.save();
    
    logger.info({
      feedbackId: this._id,
      helpfulVotes: this.helpfulVotes,
      totalVotes: this.totalVotes
    }, 'feedback.marked_helpful');
  } catch (error) {
    logger.error({
      feedbackId: this._id,
      error: error.message
    }, 'feedback.mark_helpful_error');
    throw error;
  }
};

// Instance method to mark as not helpful
feedbackSchema.methods.markNotHelpful = async function() {
  try {
    this.totalVotes += 1;
    await this.save();
    
    logger.info({
      feedbackId: this._id,
      helpfulVotes: this.helpfulVotes,
      totalVotes: this.totalVotes
    }, 'feedback.marked_not_helpful');
  } catch (error) {
    logger.error({
      feedbackId: this._id,
      error: error.message
    }, 'feedback.mark_not_helpful_error');
    throw error;
  }
};

// Instance method to report review
feedbackSchema.methods.reportReview = async function(reason, details) {
  try {
    this.reported = true;
    this.reportReason = reason;
    this.reportDetails = details;
    await this.save();
    
    logger.info({
      feedbackId: this._id,
      reportReason: reason
    }, 'feedback.reported');
  } catch (error) {
    logger.error({
      feedbackId: this._id,
      error: error.message
    }, 'feedback.report_error');
    throw error;
  }
};

// Instance method to add business response
feedbackSchema.methods.addBusinessResponse = async function(comment, respondedBy) {
  try {
    this.businessResponse = {
      comment,
      respondedBy,
      respondedAt: new Date()
    };
    await this.save();
    
    logger.info({
      feedbackId: this._id,
      respondedBy
    }, 'feedback.business_response_added');
  } catch (error) {
    logger.error({
      feedbackId: this._id,
      error: error.message
    }, 'feedback.business_response_error');
    throw error;
  }
};

// Static method to get reviews by business
feedbackSchema.statics.getReviewsByBusiness = async function(businessId, page = 1, limit = 10, sort = 'newest') {
  try {
    const skip = (page - 1) * limit;
    
    let sortCriteria = {};
    switch (sort) {
      case 'newest':
        sortCriteria = { createdAt: -1 };
        break;
      case 'oldest':
        sortCriteria = { createdAt: 1 };
        break;
      case 'rating':
        sortCriteria = { rating: -1, createdAt: -1 };
        break;
      case 'helpful':
        sortCriteria = { helpfulVotes: -1, createdAt: -1 };
        break;
      default:
        sortCriteria = { createdAt: -1 };
    }
    
    const [reviews, total] = await Promise.all([
      this.find({
        businessId,
        approved: true
      })
      .populate('userId', 'firstName lastName nickname avatar')
      .sort(sortCriteria)
      .skip(skip)
      .limit(limit)
      .lean(),
      this.countDocuments({
        businessId,
        approved: true
      })
    ]);
    
    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error({
      businessId,
      error: error.message
    }, 'feedback.reviews_by_business_error');
    throw error;
  }
};

// Static method to get reviews by user
feedbackSchema.statics.getReviewsByUser = async function(userId, page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;
    
    const [reviews, total] = await Promise.all([
      this.find({ userId })
      .populate('businessId', 'name logo rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
      this.countDocuments({ userId })
    ]);
    
    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error({
      userId,
      error: error.message
    }, 'feedback.reviews_by_user_error');
    throw error;
  }
};

// Static method to get pending reviews for moderation
feedbackSchema.statics.getPendingReviews = async function(page = 1, limit = 20) {
  try {
    const skip = (page - 1) * limit;
    
    const [reviews, total] = await Promise.all([
      this.find({ approved: false })
      .populate('userId', 'firstName lastName email')
      .populate('businessId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
      this.countDocuments({ approved: false })
    ]);
    
    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error({
      error: error.message
    }, 'feedback.pending_reviews_error');
    throw error;
  }
};

// Static method to get reported reviews
feedbackSchema.statics.getReportedReviews = async function(page = 1, limit = 20) {
  try {
    const skip = (page - 1) * limit;
    
    const [reviews, total] = await Promise.all([
      this.find({ reported: true })
      .populate('userId', 'firstName lastName email')
      .populate('businessId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
      this.countDocuments({ reported: true })
    ]);
    
    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error({
      error: error.message
    }, 'feedback.reported_reviews_error');
    throw error;
  }
};

// Static method to get review statistics
feedbackSchema.statics.getReviewStats = async function() {
  try {
    const stats = await this.aggregate([
      { $match: { approved: true } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          totalHelpfulVotes: { $sum: '$helpfulVotes' },
          totalVotes: { $sum: '$totalVotes' },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    if (stats.length > 0) {
      const stat = stats[0];
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      stat.ratingDistribution.forEach(rating => {
        distribution[rating]++;
      });
      stat.ratingDistribution = distribution;
      return stat;
    }

    return {};
  } catch (error) {
    logger.error({
      error: error.message
    }, 'feedback.stats_error');
    throw error;
  }
};

// Export the model
module.exports = mongoose.model('Feedback', feedbackSchema); 