const mongoose = require('mongoose');
const logger = require('../../logger');

const categorySchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  nameEn: {
    type: String,
    trim: true,
    maxlength: [100, 'English category name cannot exceed 100 characters']
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
  
  // Visual & Display
  icon: {
    type: String,
    validate: {
      validator: function(v) {
        if (v) {
          // Allow URLs, alphanumeric with hyphens/underscores, or emojis
          return /^https?:\/\/.+/.test(v) || /^[a-zA-Z0-9-_]+$/.test(v) || /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(v);
        }
        return true;
      },
      message: 'Invalid icon format. Use URL, alphanumeric text, or emoji'
    }
  },
  color: {
    type: String,
    validate: {
      validator: function(v) {
        if (v) {
          return /^#[0-9A-F]{6}$/i.test(v);
        }
        return true;
      },
      message: 'Invalid color format (use hex color)'
    }
  },
  
  // Hierarchy & Organization
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 0,
    min: [0, 'Level cannot be negative']
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
  serviceCount: {
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
  metaTitle: {
    type: String,
    maxlength: [60, 'Meta title cannot exceed 60 characters']
  },
  metaDescription: {
    type: String,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
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
categorySchema.index({ active: 1, sortOrder: 1, name: 1 });
categorySchema.index({ name: 'text' });
categorySchema.index({ parentId: 1, active: 1 });
categorySchema.index({ businessCount: -1, active: 1 });
categorySchema.index({ slug: 1 });

// Virtual for display name based on language
categorySchema.virtual('displayName').get(function() {
  // This will be set by the application based on current language
  return this.name;
});

// Virtual for display description based on language
categorySchema.virtual('displayDescription').get(function() {
  // This will be set by the application based on current language
  return this.description;
});

// Virtual for children categories
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentId'
});

// Virtual for parent category
categorySchema.virtual('parent', {
  ref: 'Category',
  localField: 'parentId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to update timestamps
categorySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Pre-save middleware to generate slug if not provided
categorySchema.pre('save', function(next) {
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

// Pre-save middleware to calculate level
categorySchema.pre('save', async function(next) {
  if (this.parentId) {
    const parent = await this.constructor.findById(this.parentId);
    this.level = parent ? parent.level + 1 : 0;
  } else {
    this.level = 0;
  }
  next();
});

// Instance method to get children categories
categorySchema.methods.getChildren = async function() {
  try {
    const children = await this.constructor.find({
      parentId: this._id,
      active: true
    }).sort({ sortOrder: 1, name: 1 });
    
    logger.info({
      categoryId: this._id,
      childrenCount: children.length
    }, 'category.children_retrieved');
    
    return children;
  } catch (error) {
    logger.error({
      categoryId: this._id,
      error: error.message
    }, 'category.children_retrieval_error');
    throw error;
  }
};

// Instance method to get parent category
categorySchema.methods.getParent = async function() {
  try {
    if (!this.parentId) return null;
    
    const parent = await this.constructor.findById(this.parentId);
    
    logger.info({
      categoryId: this._id,
      parentId: this.parentId
    }, 'category.parent_retrieved');
    
    return parent;
  } catch (error) {
    logger.error({
      categoryId: this._id,
      error: error.message
    }, 'category.parent_retrieval_error');
    throw error;
  }
};

// Instance method to get all ancestors
categorySchema.methods.getAncestors = async function() {
  try {
    const ancestors = [];
    let currentCategory = this;
    
    while (currentCategory.parentId) {
      const parent = await this.constructor.findById(currentCategory.parentId);
      if (parent) {
        ancestors.unshift(parent);
        currentCategory = parent;
      } else {
        break;
      }
    }
    
    logger.info({
      categoryId: this._id,
      ancestorsCount: ancestors.length
    }, 'category.ancestors_retrieved');
    
    return ancestors;
  } catch (error) {
    logger.error({
      categoryId: this._id,
      error: error.message
    }, 'category.ancestors_retrieval_error');
    throw error;
  }
};

// Instance method to get all descendants
categorySchema.methods.getDescendants = async function() {
  try {
    const descendants = [];
    const queue = [this._id];
    
    while (queue.length > 0) {
      const currentId = queue.shift();
      const children = await this.constructor.find({ parentId: currentId });
      
      for (const child of children) {
        descendants.push(child);
        queue.push(child._id);
      }
    }
    
    logger.info({
      categoryId: this._id,
      descendantsCount: descendants.length
    }, 'category.descendants_retrieved');
    
    return descendants;
  } catch (error) {
    logger.error({
      categoryId: this._id,
      error: error.message
    }, 'category.descendants_retrieval_error');
    throw error;
  }
};

// Instance method to update business count
categorySchema.methods.updateBusinessCount = async function() {
  try {
    const count = await this.model('Business').countDocuments({
      categoryId: this._id,
      active: true,
      approved: true
    });
    
    this.businessCount = count;
    await this.save();
    
    logger.info({
      categoryId: this._id,
      businessCount: count
    }, 'category.business_count_updated');
  } catch (error) {
    logger.error({
      categoryId: this._id,
      error: error.message
    }, 'category.business_count_update_error');
    throw error;
  }
};

// Instance method to update service count
categorySchema.methods.updateServiceCount = async function() {
  try {
    const count = await this.model('Service').countDocuments({
      categoryId: this._id,
      active: true
    });
    
    this.serviceCount = count;
    await this.save();
    
    logger.info({
      categoryId: this._id,
      serviceCount: count
    }, 'category.service_count_updated');
  } catch (error) {
    logger.error({
      categoryId: this._id,
      error: error.message
    }, 'category.service_count_update_error');
    throw error;
  }
};

// Static method to get root categories
categorySchema.statics.getRootCategories = async function() {
  try {
    const categories = await this.find({
      parentId: null,
      active: true
    }).sort({ sortOrder: 1, name: 1 });
    
    logger.info({
      rootCategoriesCount: categories.length
    }, 'category.root_categories_retrieved');
    
    return categories;
  } catch (error) {
    logger.error({
      error: error.message
    }, 'category.root_categories_retrieval_error');
    throw error;
  }
};

// Static method to get category tree
categorySchema.statics.getCategoryTree = async function() {
  try {
    const buildTree = async (parentId = null) => {
      const categories = await this.find({
        parentId,
        active: true
      }).sort({ sortOrder: 1, name: 1 });
      
      const tree = [];
      for (const category of categories) {
        const children = await buildTree(category._id);
        tree.push({
          ...category.toObject(),
          children
        });
      }
      
      return tree;
    };
    
    const tree = await buildTree();
    
    logger.info({
      treeDepth: tree.length
    }, 'category.tree_retrieved');
    
    return tree;
  } catch (error) {
    logger.error({
      error: error.message
    }, 'category.tree_retrieval_error');
    throw error;
  }
};

// Static method to get category statistics
categorySchema.statics.getCategoryStats = async function() {
  try {
    const stats = await this.aggregate([
      { $match: { active: true } },
      {
        $group: {
          _id: null,
          totalCategories: { $sum: 1 },
          rootCategories: { $sum: { $cond: [{ $eq: ['$parentId', null] }, 1, 0] } },
          subCategories: { $sum: { $cond: [{ $ne: ['$parentId', null] }, 1, 0] } },
          avgBusinessCount: { $avg: '$businessCount' },
          avgServiceCount: { $avg: '$serviceCount' },
          featuredCategories: { $sum: { $cond: ['$featured', 1, 0] } }
        }
      }
    ]);

    return stats[0] || {};
  } catch (error) {
    logger.error({
      error: error.message
    }, 'category.stats_error');
    throw error;
  }
};

// Export the model
module.exports = mongoose.model('Category', categorySchema); 