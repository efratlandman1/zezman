const mongoose = require('mongoose');
const logger = require('../../logger');

const suggestionSchema = new mongoose.Schema({
  // Basic Information
  type: {
    type: String,
    enum: ['business', 'category', 'service', 'feature', 'bug', 'improvement', 'other'],
    required: [true, 'Suggestion type is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Submitter Information
  suggestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Submitter is required']
  },
  submitterEmail: {
    type: String,
    required: [true, 'Submitter email is required'],
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  submitterName: {
    type: String,
    trim: true,
    maxlength: [100, 'Submitter name cannot exceed 100 characters']
  },
  
  // Related Entities
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business'
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  
  // Priority & Status
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'implemented'],
    default: 'pending'
  },
  
  // Admin Response
  adminResponse: {
    comment: {
      type: String,
      maxlength: [1000, 'Admin response cannot exceed 1000 characters'],
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
  
  // Additional Information
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  
  // Contact Information
  contactInfo: {
    phone: {
      type: String,
      maxlength: [20, 'Phone number cannot exceed 20 characters']
    },
    preferredContact: {
      type: String,
      enum: ['email', 'phone'],
      default: 'email'
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
suggestionSchema.index({ status: 1, createdAt: -1 });
suggestionSchema.index({ suggestedBy: 1 });
suggestionSchema.index({ type: 1, status: 1 });
suggestionSchema.index({ categoryId: 1, status: 1 });
suggestionSchema.index({ submitterEmail: 1 });
suggestionSchema.index({ priority: 1, status: 1 });

// Virtual for submitter
suggestionSchema.virtual('submitter', {
  ref: 'User',
  localField: 'suggestedBy',
  foreignField: '_id',
  justOne: true
});

// Virtual for admin responder
suggestionSchema.virtual('adminResponder', {
  ref: 'User',
  localField: 'adminResponse.respondedBy',
  foreignField: '_id',
  justOne: true
});

// Virtual for category
suggestionSchema.virtual('category', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true
});

// Virtual for business
suggestionSchema.virtual('business', {
  ref: 'Business',
  localField: 'businessId',
  foreignField: '_id',
  justOne: true
});

// Virtual for service
suggestionSchema.virtual('service', {
  ref: 'Service',
  localField: 'serviceId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to update timestamps
suggestionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to add admin response
suggestionSchema.methods.addAdminResponse = async function(comment, respondedBy) {
  try {
    this.adminResponse = {
      comment,
      respondedBy,
      respondedAt: new Date()
    };
    await this.save();
    
    logger.info({
      suggestionId: this._id,
      respondedBy
    }, 'suggestion.admin_response_added');
  } catch (error) {
    logger.error({
      suggestionId: this._id,
      error: error.message
    }, 'suggestion.admin_response_error');
    throw error;
  }
};

// Instance method to update status
suggestionSchema.methods.updateStatus = async function(status, comment = '', respondedBy = null) {
  try {
    this.status = status;
    
    if (comment) {
      this.adminResponse = {
        comment,
        respondedBy,
        respondedAt: new Date()
      };
    }
    
    await this.save();
    
    logger.info({
      suggestionId: this._id,
      status,
      respondedBy
    }, 'suggestion.status_updated');
  } catch (error) {
    logger.error({
      suggestionId: this._id,
      error: error.message
    }, 'suggestion.status_update_error');
    throw error;
  }
};

// Static method to get suggestions by status
suggestionSchema.statics.getSuggestionsByStatus = async function(status, page = 1, limit = 20) {
  try {
    const skip = (page - 1) * limit;
    
    const [suggestions, total] = await Promise.all([
      this.find({ status })
      .populate('suggestedBy', 'firstName lastName email')
      .populate('adminResponse.respondedBy', 'firstName lastName')
      .populate('categoryId', 'name')
      .populate('businessId', 'name')
      .populate('serviceId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
      this.countDocuments({ status })
    ]);
    
    return {
      suggestions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error({
      status,
      error: error.message
    }, 'suggestion.by_status_error');
    throw error;
  }
};

// Static method to get suggestions by type
suggestionSchema.statics.getSuggestionsByType = async function(type, page = 1, limit = 20) {
  try {
    const skip = (page - 1) * limit;
    
    const [suggestions, total] = await Promise.all([
      this.find({ type })
      .populate('suggestedBy', 'firstName lastName email')
      .populate('adminResponse.respondedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
      this.countDocuments({ type })
    ]);
    
    return {
      suggestions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error({
      type,
      error: error.message
    }, 'suggestion.by_type_error');
    throw error;
  }
};

// Static method to get user suggestions
suggestionSchema.statics.getUserSuggestions = async function(userId, page = 1, limit = 20) {
  try {
    const skip = (page - 1) * limit;
    
    const [suggestions, total] = await Promise.all([
      this.find({ suggestedBy: userId })
      .populate('adminResponse.respondedBy', 'firstName lastName')
      .populate('categoryId', 'name')
      .populate('businessId', 'name')
      .populate('serviceId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
      this.countDocuments({ suggestedBy: userId })
    ]);
    
    return {
      suggestions,
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
    }, 'suggestion.user_suggestions_error');
    throw error;
  }
};

// Static method to get pending suggestions
suggestionSchema.statics.getPendingSuggestions = async function(page = 1, limit = 20) {
  try {
    const skip = (page - 1) * limit;
    
    const [suggestions, total] = await Promise.all([
      this.find({ status: 'pending' })
      .populate('suggestedBy', 'firstName lastName email')
      .populate('categoryId', 'name')
      .populate('businessId', 'name')
      .populate('serviceId', 'name')
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
      this.countDocuments({ status: 'pending' })
    ]);
    
    return {
      suggestions,
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
    }, 'suggestion.pending_error');
    throw error;
  }
};

// Static method to get suggestion statistics
suggestionSchema.statics.getSuggestionStats = async function() {
  try {
    const stats = await this.aggregate([
      {
        $group: {
          _id: null,
          totalSuggestions: { $sum: 1 },
          pendingSuggestions: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          underReviewSuggestions: { $sum: { $cond: [{ $eq: ['$status', 'under_review'] }, 1, 0] } },
          approvedSuggestions: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          rejectedSuggestions: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          implementedSuggestions: { $sum: { $cond: [{ $eq: ['$status', 'implemented'] }, 1, 0] } },
          criticalSuggestions: { $sum: { $cond: [{ $eq: ['$priority', 'critical'] }, 1, 0] } },
          highPrioritySuggestions: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } }
        }
      }
    ]);

    return stats[0] || {};
  } catch (error) {
    logger.error({
      error: error.message
    }, 'suggestion.stats_error');
    throw error;
  }
};

// Static method to get suggestions by priority
suggestionSchema.statics.getSuggestionsByPriority = async function(priority, page = 1, limit = 20) {
  try {
    const skip = (page - 1) * limit;
    
    const [suggestions, total] = await Promise.all([
      this.find({ priority })
      .populate('suggestedBy', 'firstName lastName email')
      .populate('adminResponse.respondedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
      this.countDocuments({ priority })
    ]);
    
    return {
      suggestions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error({
      priority,
      error: error.message
    }, 'suggestion.by_priority_error');
    throw error;
  }
};

// Export the model
module.exports = mongoose.model('Suggestion', suggestionSchema); 