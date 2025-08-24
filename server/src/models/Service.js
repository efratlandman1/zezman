const mongoose = require('mongoose');
const logger = require('../../logger');

const serviceSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    maxlength: [100, 'Service name cannot exceed 100 characters']
  },
  nameEn: {
    type: String,
    trim: true,
    maxlength: [100, 'English service name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    trim: true
  },
  descriptionEn: {
    type: String,
    maxlength: [500, 'English description cannot exceed 500 characters'],
    trim: true
  },
  
  // Category & Organization
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  
  // Status & Visibility
  active: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  
  // Statistics
  businessCount: {
    type: Number,
    default: 0
  },
  
  // SEO & Meta
  slug: {
    type: String,
    unique: true,
    sparse: true,
    validate: {
      validator: function(v) {
        if (v) {
          return /^[a-z0-9-]+$/.test(v);
        }
        return true;
      },
      message: 'Slug can only contain lowercase letters, numbers, and hyphens'
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
serviceSchema.index({ categoryId: 1, active: 1 });
serviceSchema.index({ name: 'text' });
serviceSchema.index({ active: 1, sortOrder: 1 });
serviceSchema.index({ businessCount: -1, active: 1 });
serviceSchema.index({ slug: 1 });

// Virtual for display name based on language
serviceSchema.virtual('displayName').get(function() {
  // This will be set by the application based on current language
  return this.name;
});

// Virtual for display description based on language
serviceSchema.virtual('displayDescription').get(function() {
  // This will be set by the application based on current language
  return this.description;
});

// Virtual for category
serviceSchema.virtual('category', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to update timestamps
serviceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Pre-save middleware to generate slug if not provided
serviceSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

// Instance method to update business count
serviceSchema.methods.updateBusinessCount = async function() {
  try {
    const count = await this.model('Business').countDocuments({
      'services.serviceId': this._id,
      active: true,
      approved: true
    });
    
    this.businessCount = count;
    await this.save();
    
    logger.info({
      serviceId: this._id,
      businessCount: count
    }, 'service.business_count_updated');
  } catch (error) {
    logger.error({
      serviceId: this._id,
      error: error.message
    }, 'service.business_count_update_error');
    throw error;
  }
};

// Static method to get services by category
serviceSchema.statics.getServicesByCategory = async function(categoryId) {
  try {
    const services = await this.find({
      categoryId,
      active: true
    }).sort({ sortOrder: 1, name: 1 });
    
    logger.info({
      categoryId,
      servicesCount: services.length
    }, 'service.services_by_category_retrieved');
    
    return services;
  } catch (error) {
    logger.error({
      categoryId,
      error: error.message
    }, 'service.services_by_category_retrieval_error');
    throw error;
  }
};

// Static method to get featured services
serviceSchema.statics.getFeaturedServices = async function(limit = 10) {
  try {
    const services = await this.find({
      featured: true,
      active: true
    })
    .sort({ businessCount: -1, name: 1 })
    .limit(limit);
    
    logger.info({
      featuredServicesCount: services.length
    }, 'service.featured_services_retrieved');
    
    return services;
  } catch (error) {
    logger.error({
      error: error.message
    }, 'service.featured_services_retrieval_error');
    throw error;
  }
};

// Static method to get service statistics
serviceSchema.statics.getServiceStats = async function() {
  try {
    const stats = await this.aggregate([
      { $match: { active: true } },
      {
        $group: {
          _id: null,
          totalServices: { $sum: 1 },
          featuredServices: { $sum: { $cond: ['$featured', 1, 0] } },
          avgBusinessCount: { $avg: '$businessCount' },
          maxBusinessCount: { $max: '$businessCount' },
          minBusinessCount: { $min: '$businessCount' }
        }
      }
    ]);

    return stats[0] || {};
  } catch (error) {
    logger.error({
      error: error.message
    }, 'service.stats_error');
    throw error;
  }
};

// Export the model
module.exports = mongoose.model('Service', serviceSchema); 