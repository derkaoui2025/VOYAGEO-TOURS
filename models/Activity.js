const mongoose = require('mongoose');
const slugify = require('slugify');

const activitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Activity title is required'],
    trim: true,
    maxlength: [100, 'Activity title cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true
  },
  // This field won't change when title changes
  originalSlug: {
    type: String
  },
  description: {
    type: String,
    required: [true, 'Activity description is required'],
    trim: true
  },
  includes: {
    type: String,
    trim: true,
    default: ''
  },
  notIncludes: {
    type: String,
    trim: true,
    default: ''
  },
  location: {
    type: String,
    trim: true
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [0.5, 'Duration must be at least 0.5 hours']
  },
  durationType: {
    type: String,
    enum: ['hours', 'days'],
    default: 'hours'
  },
  gallery: [{
    type: String,
    trim: true
  }],
  galleryPublicIds: [{
    type: String,
    trim: true
  }],
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate a random 4-digit number
const generateRandomSuffix = () => {
  return Math.floor(1000 + Math.random() * 9000); // 4-digit number between 1000-9999
};

// Create slug from title before saving
activitySchema.pre('save', function(next) {
  if (!this.originalSlug) {
    // First time saving - create the originalSlug with random suffix
    const baseSlug = slugify(this.title, { 
      lower: true, 
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
    
    // Add random 4-digit number
    this.originalSlug = `${baseSlug}-${generateRandomSuffix()}`;
    this.slug = this.originalSlug;
  } else if (this.isModified('title')) {
    // Title changed but originalSlug exists - keep the same originalSlug but update the regular slug
    // This allows both URLs to work - the original one with random numbers and a new one with the updated title
    const baseSlug = slugify(this.title, { 
      lower: true, 
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
    
    this.slug = this.originalSlug;
  }
  
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Activity', activitySchema); 