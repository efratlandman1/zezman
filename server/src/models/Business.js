const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  // Required fields
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  address: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function(v) {
          return v.length === 2 && 
                 v[0] >= -180 && v[0] <= 180 && 
                 v[1] >= -90 && v[1] <= 90;
        },
        message: 'Invalid coordinates. Must be [longitude, latitude]'
      }
    }
  },
  prefix: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    maxlength: 15,
    validate: {
      validator: function(v) {
        return /^[0-9+\-\s()]+$/.test(v);
      },
      message: 'Invalid phone format'
    }
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Optional fields
  logo: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid URL format'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  active: {
    type: Boolean,
    default: true
  },
  approved: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
  },
  verified: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  ratingDistribution: {
    1: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
    4: { type: Number, default: 0 },
    5: { type: Number, default: 0 }
  },
  viewCount: {
    type: Number,
    default: 0
  },
  favoriteCount: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  city: {
    type: String,
    trim: true,
    maxlength: 50
  },
  country: {
    type: String,
    trim: true,
    maxlength: 50,
    default: 'Israel'
  },
  postalCode: {
    type: String,
    trim: true,
    maxlength: 10
  },
  website: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid URL format'
    }
  },
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String,
    linkedin: String
  },
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid URL format'
    }
  }],
  services: [{
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service'
    },
    name: String,
    description: String,
    price: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'ILS'
    }
  }],
  openingHours: [{
    day: {
      type: Number,
      required: true,
      min: 0,
      max: 6 // 0 = Sunday, 6 = Saturday
    },
    closed: {
      type: Boolean,
      default: false
    },
    ranges: [{
      open: {
        type: String,
        validate: {
          validator: function(v) {
            return !v || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'Invalid time format (HH:MM)'
        }
      },
      close: {
        type: String,
        validate: {
          validator: function(v) {
            return !v || /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'Invalid time format (HH:MM)'
        }
      }
    }]
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  amenities: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  
  // System fields
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
businessSchema.index({ location: '2dsphere' });
businessSchema.index({ name: 'text', description: 'text' });
businessSchema.index({ categoryId: 1, active: 1, approved: 1 });
businessSchema.index({ userId: 1, active: 1 });
businessSchema.index({ rating: -1, active: 1, approved: 1 });
businessSchema.index({ location: '2dsphere', categoryId: 1 });
businessSchema.index({ createdAt: -1, active: 1, approved: 1 });
businessSchema.index({ featured: 1, active: 1, approved: 1 });
businessSchema.index({ city: 1, active: 1, approved: 1 });
businessSchema.index({ verified: 1, active: 1, approved: 1 });
businessSchema.index({ viewCount: -1, active: 1, approved: 1 });
businessSchema.index({ favoriteCount: -1, active: 1, approved: 1 });

// Pre-save middleware
businessSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
businessSchema.methods.updateRating = async function() {
  const Feedback = this.model('Feedback');
  const feedback = await Feedback.find({ 
    businessId: this._id, 
    approved: true 
  });
  
  if (feedback.length > 0) {
    const avgRating = feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length;
    this.rating = Math.round(avgRating * 10) / 10; // Round to 1 decimal
    this.totalRatings = feedback.length;
    
    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedback.forEach(review => {
      distribution[review.rating]++;
    });
    this.ratingDistribution = distribution;
  } else {
    this.rating = 0;
    this.totalRatings = 0;
    this.ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  }
  
  await this.save();
};

businessSchema.methods.updateStatistics = async function() {
  const [favoriteCount, reviewCount] = await Promise.all([
    this.model('Favorite').countDocuments({ businessId: this._id }),
    this.model('Feedback').countDocuments({ businessId: this._id, approved: true })
  ]);
  
  this.favoriteCount = favoriteCount;
  this.reviewCount = reviewCount;
  await this.save();
};

businessSchema.methods.incrementViewCount = async function() {
  this.viewCount += 1;
  await this.save();
};

businessSchema.methods.isOpen = function() {
  if (!this.openingHours || this.openingHours.length === 0) {
    return true; // Assume open if no hours specified
  }
  
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  
  const todayHours = this.openingHours.find(h => h.day === currentDay);
  
  if (!todayHours || todayHours.closed) {
    return false;
  }
  
  if (!todayHours.ranges || todayHours.ranges.length === 0) {
    return true; // Assume open if no specific ranges
  }
  
  return todayHours.ranges.some(range => {
    return currentTime >= range.open && currentTime <= range.close;
  });
};

businessSchema.methods.getDistance = function(lat, lng) {
  if (!this.location || !this.location.coordinates) {
    return null;
  }
  
  const [businessLng, businessLat] = this.location.coordinates;
  const R = 6371; // Earth's radius in kilometers
  
  const dLat = (lat - businessLat) * Math.PI / 180;
  const dLng = (lng - businessLng) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(businessLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

// Static methods
businessSchema.statics.findNearby = function(lat, lng, maxDistance = 10) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: maxDistance * 1000 // Convert to meters
      }
    },
    active: true,
    approved: true
  });
};

businessSchema.statics.findByCategory = function(categoryId, options = {}) {
  const query = {
    categoryId,
    active: true,
    approved: true
  };
  
  if (options.featured) {
    query.featured = true;
  }
  
  if (options.verified) {
    query.verified = true;
  }
  
  return this.find(query).sort(options.sort || { rating: -1 });
};

businessSchema.statics.findFeatured = function() {
  return this.find({
    featured: true,
    active: true,
    approved: true
  }).sort({ rating: -1, favoriteCount: -1 });
};

businessSchema.statics.search = function(searchTerm, options = {}) {
  const query = {
    $text: { $search: searchTerm },
    active: true,
    approved: true
  };
  
  if (options.categoryId) {
    query.categoryId = options.categoryId;
  }
  
  if (options.city) {
    query.city = new RegExp(options.city, 'i');
  }
  
  if (options.minRating) {
    query.rating = { $gte: options.minRating };
  }
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } });
};

// Virtual fields
businessSchema.virtual('fullAddress').get(function() {
  const parts = [this.address];
  if (this.city) parts.push(this.city);
  if (this.postalCode) parts.push(this.postalCode);
  if (this.country) parts.push(this.country);
  return parts.join(', ');
});

businessSchema.virtual('phoneWithPrefix').get(function() {
  return this.prefix ? `${this.prefix} ${this.phone}` : this.phone;
});

businessSchema.virtual('averageRating').get(function() {
  return this.totalRatings > 0 ? this.rating : 0;
});

// JSON serialization
businessSchema.methods.toJSON = function() {
  const businessObject = this.toObject();
  
  // Add virtual fields
  businessObject.fullAddress = this.fullAddress;
  businessObject.phoneWithPrefix = this.phoneWithPrefix;
  businessObject.averageRating = this.averageRating;
  businessObject.isOpen = this.isOpen();
  
  return businessObject;
};

const Business = mongoose.model('Business', businessSchema);

module.exports = Business; 