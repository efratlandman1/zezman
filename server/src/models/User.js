const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  // Required fields
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  password: {
    type: String,
    required: function() { return this.authProvider === 'local'; },
    minlength: 8,
    validate: {
      validator: function(v) {
        if (this.authProvider === 'local') {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(v);
        }
        return true;
      },
      message: 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character'
    }
  },
  authProvider: {
    type: String,
    required: true,
    enum: ['local', 'google'],
    default: 'local'
  },
  
  // Optional fields
  firstName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  nickname: {
    type: String,
    trim: true,
    maxlength: 30
  },
  phonePrefix: {
    type: String,
    trim: true,
    maxlength: 5
  },
  phone: {
    type: String,
    trim: true,
    maxlength: 15,
    validate: {
      validator: function(v) {
        return !v || /^[0-9+\-\s()]+$/.test(v);
      },
      message: 'Invalid phone format'
    }
  },
  providerId: {
    type: String,
    sparse: true
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'end-user'],
    default: 'end-user'
  },
  is_verified: {
    type: Boolean,
    default: false
  },
  verification_token: {
    type: String
  },
  
  // System fields
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  last_login: {
    type: Date
  },
  login_attempts: {
    type: Number,
    default: 0
  },
  lockout_until: {
    type: Date
  },
  preferences: {
    language: {
      type: String,
      enum: ['en', 'he'],
      default: 'en'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ authProvider: 1, providerId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ is_verified: 1 });
userSchema.index({ 'preferences.language': 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ last_login: -1 });

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Hash password if modified
  if (this.isModified('password')) {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
  }
  
  // Update timestamp
  this.updatedAt = new Date();
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function() {
  const payload = {
    userId: this._id,
    email: this.email,
    role: this.role
  };
  
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  return jwt.sign(payload, secret, { expiresIn });
};

userSchema.methods.generateRefreshToken = function() {
  const payload = {
    userId: this._id,
    type: 'refresh'
  };
  
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
  
  return jwt.sign(payload, secret, { expiresIn });
};

userSchema.methods.updateLoginStats = function() {
  this.last_login = new Date();
  this.login_attempts = 0;
  this.lockout_until = undefined;
  return this.save();
};

userSchema.methods.incrementLoginAttempts = function() {
  this.login_attempts += 1;
  
  // Lock account after max attempts
  const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
  const lockoutDuration = parseInt(process.env.LOGIN_LOCKOUT_DURATION) || 900000; // 15 minutes
  
  if (this.login_attempts >= maxAttempts) {
    this.lockout_until = new Date(Date.now() + lockoutDuration);
  }
  
  return this.save();
};

userSchema.methods.isLocked = function() {
  return this.lockout_until && this.lockout_until > new Date();
};

userSchema.methods.getFullName = function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.firstName || this.lastName || this.nickname || this.email;
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByProviderId = function(provider, providerId) {
  return this.findOne({ authProvider: provider, providerId });
};

userSchema.statics.findVerifiedUsers = function() {
  return this.find({ is_verified: true });
};

userSchema.statics.findByRole = function(role) {
  return this.find({ role });
};

// Virtual fields
userSchema.virtual('displayName').get(function() {
  return this.getFullName();
});

userSchema.virtual('isAdmin').get(function() {
  return this.role === 'admin';
});

userSchema.virtual('isManager').get(function() {
  return this.role === 'manager' || this.role === 'admin';
});

// JSON serialization
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  
  // Remove sensitive fields
  delete userObject.password;
  delete userObject.verification_token;
  delete userObject.login_attempts;
  delete userObject.lockout_until;
  
  return userObject;
};

const User = mongoose.model('User', userSchema);

module.exports = User; 