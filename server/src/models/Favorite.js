const mongoose = require('mongoose');
const logger = require('../../logger');

const favoriteSchema = new mongoose.Schema({
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
  
  // Additional Information
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    trim: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
favoriteSchema.index({ userId: 1, businessId: 1 }, { unique: true });
favoriteSchema.index({ userId: 1, createdAt: -1 });
favoriteSchema.index({ businessId: 1, createdAt: -1 });

// Virtual for user
favoriteSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for business
favoriteSchema.virtual('business', {
  ref: 'Business',
  localField: 'businessId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to update business favorite count
favoriteSchema.pre('save', async function(next) {
  try {
    if (this.isNew) {
      const business = await this.model('Business').findById(this.businessId);
      if (business) {
        business.favoriteCount += 1;
        await business.save();
      }
    }
    next();
  } catch (error) {
    logger.error({
      favoriteId: this._id,
      businessId: this.businessId,
      error: error.message
    }, 'favorite.business_count_update_error');
    next(error);
  }
});

// Pre-remove middleware to update business favorite count
favoriteSchema.pre('remove', async function(next) {
  try {
    const business = await this.model('Business').findById(this.businessId);
    if (business && business.favoriteCount > 0) {
      business.favoriteCount -= 1;
      await business.save();
    }
    next();
  } catch (error) {
    logger.error({
      favoriteId: this._id,
      businessId: this.businessId,
      error: error.message
    }, 'favorite.business_count_remove_error');
    next(error);
  }
});

// Static method to add favorite
favoriteSchema.statics.addFavorite = async function(userId, businessId, notes = '') {
  try {
    // Check if already favorited
    const existingFavorite = await this.findOne({ userId, businessId });
    if (existingFavorite) {
      throw new Error('Business is already in favorites');
    }

    const favorite = new this({
      userId,
      businessId,
      notes
    });

    await favorite.save();
    
    logger.info({
      userId,
      businessId,
      favoriteId: favorite._id
    }, 'favorite.added');
    
    return favorite;
  } catch (error) {
    logger.error({
      userId,
      businessId,
      error: error.message
    }, 'favorite.add_error');
    throw error;
  }
};

// Static method to remove favorite
favoriteSchema.statics.removeFavorite = async function(userId, businessId) {
  try {
    const favorite = await this.findOneAndDelete({ userId, businessId });
    
    if (!favorite) {
      throw new Error('Favorite not found');
    }
    
    logger.info({
      userId,
      businessId,
      favoriteId: favorite._id
    }, 'favorite.removed');
    
    return favorite;
  } catch (error) {
    logger.error({
      userId,
      businessId,
      error: error.message
    }, 'favorite.remove_error');
    throw error;
  }
};

// Static method to check if business is favorited
favoriteSchema.statics.isFavorited = async function(userId, businessId) {
  try {
    const favorite = await this.findOne({ userId, businessId });
    return !!favorite;
  } catch (error) {
    logger.error({
      userId,
      businessId,
      error: error.message
    }, 'favorite.check_error');
    throw error;
  }
};

// Static method to get user favorites
favoriteSchema.statics.getUserFavorites = async function(userId, page = 1, limit = 20) {
  try {
    const skip = (page - 1) * limit;
    
    const [favorites, total] = await Promise.all([
      this.find({ userId })
      .populate({
        path: 'businessId',
        select: 'name description rating categoryId location images logo totalRatings',
        populate: { path: 'categoryId', select: 'name' }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
      this.countDocuments({ userId })
    ]);
    
    return {
      favorites: favorites.map(f => f.businessId),
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
    }, 'favorite.user_favorites_error');
    throw error;
  }
};

// Static method to get business favorites count
favoriteSchema.statics.getBusinessFavoritesCount = async function(businessId) {
  try {
    const count = await this.countDocuments({ businessId });
    
    logger.info({
      businessId,
      favoritesCount: count
    }, 'favorite.business_count_retrieved');
    
    return count;
  } catch (error) {
    logger.error({
      businessId,
      error: error.message
    }, 'favorite.business_count_error');
    throw error;
  }
};

// Static method to get most favorited businesses
favoriteSchema.statics.getMostFavoritedBusinesses = async function(limit = 10) {
  try {
    const businesses = await this.aggregate([
      {
        $group: {
          _id: '$businessId',
          favoriteCount: { $sum: 1 }
        }
      },
      {
        $sort: { favoriteCount: -1 }
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: 'businesses',
          localField: '_id',
          foreignField: '_id',
          as: 'business'
        }
      },
      {
        $unwind: '$business'
      },
      {
        $match: {
          'business.active': true,
          'business.approved': true
        }
      },
      {
        $project: {
          _id: '$business._id',
          name: '$business.name',
          description: '$business.description',
          rating: '$business.rating',
          logo: '$business.logo',
          favoriteCount: 1
        }
      }
    ]);
    
    logger.info({
      mostFavoritedCount: businesses.length
    }, 'favorite.most_favorited_retrieved');
    
    return businesses;
  } catch (error) {
    logger.error({
      error: error.message
    }, 'favorite.most_favorited_error');
    throw error;
  }
};

// Static method to get favorite statistics
favoriteSchema.statics.getFavoriteStats = async function() {
  try {
    const stats = await this.aggregate([
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

    return stats[0] || {};
  } catch (error) {
    logger.error({
      error: error.message
    }, 'favorite.stats_error');
    throw error;
  }
};

// Export the model
module.exports = mongoose.model('Favorite', favoriteSchema); 