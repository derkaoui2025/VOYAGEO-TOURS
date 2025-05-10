const mongoose = require('mongoose');
const slugify = require('slugify');

const excursionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Excursion title is required'],
    trim: true,
    maxlength: [100, 'Excursion title cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Excursion description is required'],
    trim: true
  },
  startLocation: {
    type: String,
    required: [true, 'Start location is required'],
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
  excursionType: {
    type: String,
    enum: ['private', 'public'],
    required: [true, 'Excursion type is required']
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
    default: 0,
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

// Create slug from title before saving
excursionSchema.pre('save', function(next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = slugify(this.title, { 
      lower: true, 
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Excursion', excursionSchema); 