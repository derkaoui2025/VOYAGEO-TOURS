/**
 * Blog Model
 */
const mongoose = require('mongoose');
const config = require('../config');

/**
 * Generate URL-friendly slug from title
 * @param {String} text Text to slugify
 * @returns {String} Slugified text
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/&/g, '-and-')      // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')    // Remove all non-word characters
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
}

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    index: true
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  excerpt: {
    type: String,
    required: [true, 'Excerpt is required'],
    trim: true,
    maxlength: [500, 'Excerpt cannot be more than 500 characters']
  },
  image: {
    type: String,
    default: '/images/blog/default.jpg'
  },
  author: {
    type: String,
    default: 'Admin'
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    default: 'Uncategorized',
    index: true
  },
  tags: {
    type: [String],
    default: [],
    index: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  // New fields for better SEO and social sharing
  seo: {
    metaTitle: String,
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description should not exceed 160 characters']
    },
    keywords: [String],
    ogImage: String // Open Graph image for social sharing
  },
  // New field for related posts
  relatedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog'
  }],
  // New field for comments (if enabling user comments)
  commentCount: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true, 
  toJSON: { virtuals: true }, 
  toObject: { virtuals: true }
});

// Set up indexes for better query performance
blogSchema.index({ createdAt: -1 });
blogSchema.index({ status: 1, featured: 1 });
blogSchema.index({ status: 1, category: 1 });
blogSchema.index({ tags: 1 });

// Virtual field for formatted date
blogSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual field for reading time estimation
blogSchema.virtual('readingTime').get(function() {
  const wordsPerMinute = 200;
  const text = this.content;
  
  // Strip HTML tags if content contains HTML
  const plainText = text.replace(/<[^>]*>/g, '');
  const wordCount = plainText.split(/\s+/).length;
  
  return Math.ceil(wordCount / wordsPerMinute);
});

// Middleware: Generate slug from title before saving
blogSchema.pre('save', function(next) {
  // Only generate slug if title is modified or it's a new document
  if (this.isModified('title') || this.isNew) {
    this.slug = slugify(this.title);
  }
  
  // If no meta title is specified, use the post title
  if (this.seo && !this.seo.metaTitle && this.title) {
    if (!this.seo.metaTitle) {
      this.seo.metaTitle = this.title;
    }
  }
  
  // If no meta description is specified, use the excerpt
  if (this.seo && !this.seo.metaDescription && this.excerpt) {
    this.seo.metaDescription = this.excerpt.substring(0, 160);
  }
  
  next();
});

// Static method: Find featured posts
blogSchema.statics.findFeatured = function(limit = 3) {
  return this.find({ 
    status: 'published', 
    featured: true 
  })
  .sort('-createdAt')
  .limit(limit);
};

// Static method: Find recent posts
blogSchema.statics.findRecent = function(limit = 5) {
  return this.find({ status: 'published' })
    .sort('-createdAt')
    .limit(limit);
};

// Static method: Find popular posts based on view count
blogSchema.statics.findPopular = function(limit = 5) {
  return this.find({ status: 'published' })
    .sort('-viewCount')
    .limit(limit);
};

// Static method: Find posts by tag
blogSchema.statics.findByTag = function(tag, limit = 10) {
  return this.find({ 
    status: 'published',
    tags: tag
  })
  .sort('-createdAt')
  .limit(limit);
};

// Instance method: Increase view count
blogSchema.methods.increaseViewCount = async function() {
  this.viewCount += 1;
  return this.save();
};

// Instance method: Toggle featured status
blogSchema.methods.toggleFeatured = async function() {
  this.featured = !this.featured;
  return this.save();
};

// Instance method: Toggle publish status
blogSchema.methods.togglePublishStatus = async function() {
  this.status = this.status === 'published' ? 'draft' : 'published';
  return this.save();
};

// Instance method: Add related post
blogSchema.methods.addRelatedPost = async function(postId) {
  if (!this.relatedPosts.includes(postId)) {
    this.relatedPosts.push(postId);
    return this.save();
  }
  return this;
};

// Automatically generate meta title and description if not provided
blogSchema.methods.generateSeoFields = function() {
  if (!this.seo) {
    this.seo = {};
  }
  
  if (!this.seo.metaTitle) {
    this.seo.metaTitle = this.title;
  }
  
  if (!this.seo.metaDescription) {
    // Truncate excerpt to 160 chars for meta description
    this.seo.metaDescription = this.excerpt.substring(0, 160);
  }
  
  if (!this.seo.keywords || this.seo.keywords.length === 0) {
    // Use tags as keywords
    this.seo.keywords = [...this.tags];
  }
  
  if (!this.seo.ogImage) {
    // Use post image for Open Graph
    this.seo.ogImage = this.image;
  }
  
  return this;
};

module.exports = mongoose.model('Blog', blogSchema); 