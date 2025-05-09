/**
 * Blog Service
 * 
 * Centralizes all blog-related business logic to separate it from controllers.
 * This improves code reusability, testability, and maintainability.
 */

const Blog = require('../models/Blog');

class BlogService {
  /**
   * Get featured blog posts
   * 
   * @param {Number} limit - Maximum number of posts to return
   * @returns {Promise<Array>} Array of featured blog posts
   */
  async getFeaturedPosts(limit = 3) {
    return await Blog.find({ 
      status: 'published', 
      featured: true 
    })
    .sort('-createdAt')
    .limit(limit);
  }
  
  /**
   * Get recent blog posts
   * 
   * @param {Number} limit - Maximum number of posts to return
   * @returns {Promise<Array>} Array of recent blog posts
   */
  async getRecentPosts(limit = 5) {
    return await Blog.find({ status: 'published' })
      .sort('-createdAt')
      .limit(limit);
  }
  
  /**
   * Get post by slug
   * 
   * @param {String} slug - Post slug
   * @returns {Promise<Object|null>} Blog post or null if not found
   */
  async getPostBySlug(slug) {
    return await Blog.findOne({ 
      slug,
      status: 'published'
    });
  }
  
  /**
   * Increase post view count
   * 
   * @param {String} postId - Post ID
   * @returns {Promise<void>}
   */
  async increaseViewCount(postId) {
    await Blog.findByIdAndUpdate(
      postId,
      { $inc: { viewCount: 1 } }
    );
  }
  
  /**
   * Get related posts
   * 
   * @param {String} postId - Current post ID
   * @param {String} category - Category to match
   * @param {Number} limit - Maximum number of posts to return
   * @returns {Promise<Array>} Array of related posts
   */
  async getRelatedPosts(postId, category, limit = 3) {
    return await Blog.find({ 
      category, 
      _id: { $ne: postId },
      status: 'published' 
    })
    .sort('-createdAt')
    .limit(limit);
  }
  
  /**
   * Get all blog categories with counts
   * 
   * @param {Number} limit - Maximum number of categories to return
   * @returns {Promise<Array>} Array of categories with counts
   */
  async getCategories(limit = 10) {
    return await Blog.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);
  }
  
  /**
   * Search blog posts
   * 
   * @param {String} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Array of matching blog posts
   */
  async searchPosts(query, options = {}) {
    const { 
      status = 'published', 
      limit = 10, 
      page = 1,
      sortBy = 'createdAt',
      sortDirection = 'desc'
    } = options;
    
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortDirection === 'desc' ? -1 : 1;
    
    return await Blog.find({
      status,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { excerpt: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    })
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);
  }
  
  /**
   * Get posts by category
   * 
   * @param {String} category - Category to filter by
   * @param {Number} page - Page number for pagination
   * @param {Number} limit - Posts per page
   * @returns {Promise<Object>} Object with posts and pagination data
   */
  async getPostsByCategory(category, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    // Get total post count for pagination
    const totalPosts = await Blog.countDocuments({ 
      category, 
      status: 'published' 
    });
    
    const totalPages = Math.ceil(totalPosts / limit);
    
    // Get posts for current page
    const posts = await Blog.find({ 
      category, 
      status: 'published' 
    })
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);
    
    return {
      posts,
      pagination: {
        page,
        totalPages,
        totalPosts,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }
  
  /**
   * Get all posts for admin panel
   * 
   * @returns {Promise<Array>} Array of all blog posts
   */
  async getAllPostsForAdmin() {
    return await Blog.find().sort('-createdAt');
  }
  
  /**
   * Create a new blog post
   * 
   * @param {Object} postData - Post data
   * @returns {Promise<Object>} Created blog post
   */
  async createPost(postData) {
    const { 
      title, content, excerpt, image, 
      author, status, category, tags 
    } = postData;

    // Process tags (string to array)
    const tagArray = tags ? 
      (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : 
      [];

    const newPost = new Blog({
      title,
      content,
      excerpt,
      image: image || '/images/blog/default.jpg',
      author,
      status,
      category,
      tags: tagArray
    });

    return await newPost.save();
  }
  
  /**
   * Update an existing blog post
   * 
   * @param {String} postId - Post ID
   * @param {Object} postData - Updated post data
   * @returns {Promise<Object|null>} Updated blog post or null if not found
   */
  async updatePost(postId, postData) {
    const post = await Blog.findById(postId);
    
    if (!post) {
      return null;
    }
    
    const { 
      title, content, excerpt, image, 
      author, status, category, tags 
    } = postData;
    
    // Process tags (string to array)
    const tagArray = tags ? 
      (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : 
      [];
    
    // Update post properties
    post.title = title;
    post.content = content;
    post.excerpt = excerpt;
    post.image = image || post.image;
    post.author = author;
    post.status = status;
    post.category = category;
    post.tags = tagArray;
    
    return await post.save();
  }
  
  /**
   * Delete a blog post
   * 
   * @param {String} postId - Post ID
   * @returns {Promise<boolean>} Success status
   */
  async deletePost(postId) {
    const result = await Blog.findByIdAndDelete(postId);
    return !!result;
  }
  
  /**
   * Toggle post status (draft/published)
   * 
   * @param {String} postId - Post ID
   * @returns {Promise<Object|null>} Updated blog post or null if not found
   */
  async togglePostStatus(postId) {
    const post = await Blog.findById(postId);
    
    if (!post) {
      return null;
    }
    
    post.status = post.status === 'published' ? 'draft' : 'published';
    return await post.save();
  }
  
  /**
   * Toggle featured status
   * 
   * @param {String} postId - Post ID
   * @returns {Promise<Object|null>} Updated blog post or null if not found
   */
  async toggleFeaturedStatus(postId) {
    const post = await Blog.findById(postId);
    
    if (!post) {
      return null;
    }
    
    post.featured = !post.featured;
    return await post.save();
  }
}

module.exports = new BlogService(); 