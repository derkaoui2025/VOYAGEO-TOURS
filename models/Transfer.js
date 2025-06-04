const mongoose = require('mongoose');
const slugify = require('slugify');

const transferSchema = new mongoose.Schema({
  startCity: {
    type: String,
    required: [true, 'Start city is required'],
    trim: true
  },
  endCity: {
    type: String,
    required: [true, 'End city is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    trim: true
  },
  distance: {
    type: String,
    required: [true, 'Distance is required'],
    trim: true,
    default: 'Variable'
  },
  maxPassengers: {
    type: Number,
    required: [true, 'Maximum passengers is required'],
    min: [1, 'At least one passenger is required']
  },
  vehicleType: {
    type: String,
    required: [true, 'Vehicle type is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  departureTime: {
    type: String,
    required: [true, 'Departure time is required'],
    trim: true
  },
  included: [{
    type: String,
    trim: true
  }],
  excluded: [{
    type: String,
    trim: true
  }],
  gallery: [{
    type: String,
    trim: true
  }],
  galleryPublicIds: [{
    type: String,
    trim: true
  }],
  popularity: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  slug: {
    type: String,
    unique: true
  },
  originalSlug: {
    type: String
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

const generateRandomSuffix = () => {
  return Math.floor(1000 + Math.random() * 9000);
};

transferSchema.pre('save', function(next) {
  if (!this.originalSlug) {
    const baseSlug = slugify(`${this.startCity}-to-${this.endCity}-transfer`, { 
      lower: true, 
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
    
    this.originalSlug = `${baseSlug}-${generateRandomSuffix()}`;
    this.slug = this.originalSlug;
  } else if (this.isModified('startCity') || this.isModified('endCity')) {
    this.slug = this.originalSlug;
  }
  
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Transfer', transferSchema); 