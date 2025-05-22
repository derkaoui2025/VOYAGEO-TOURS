/**
 * Frontend Blog Controller
 * 
 * Handles all public-facing blog operations
 */

const Blog = require('../models/Blog');
const moment = require('moment');

/**
 * Render the blog home page with featured and recent posts
 */
exports.renderBlogHome = async (req, res) => {
  try {
    // Get all published blog posts
    const blogPosts = await Blog.find({ status: 'published' })
      .sort('-createdAt')
      .limit(10);
    
    // Get popular categories
    const categories = await Blog.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get popular tags
    const tags = await Blog.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 }
    ]);
    
    res.render('pages/blog', {
      pageTitle: 'Voyageo Blog',
      heroTitle: 'Voyageo Tours Blog',
      heroSubtitle: 'Stories, tips, and insights for your Moroccan adventure',
      headerImagePath: '/images/headers/blog-banner.jpg',
      blogPosts,
      categories,
      tags
    });
  } catch (error) {
    console.error('Error rendering blog home:', error);
    res.render('pages/error', {
      pageTitle: 'Error',
      heroTitle: 'Something Went Wrong',
      heroSubtitle: 'We apologize for the inconvenience',
      headerImagePath: '/images/headers/error-banner.jpg',
      message: 'Failed to load blog content'
    });
  }
};

/**
 * Render paginated list of all blog posts
 */
exports.renderBlogPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 9; // Posts per page
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const totalPosts = await Blog.countDocuments({ status: 'published' });
    const totalPages = Math.ceil(totalPosts / limit);
    
    // Get posts for current page
    const posts = await Blog.find({ status: 'published' })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);
    
    // Get popular categories for sidebar
    const categories = await Blog.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get archives (group by month/year)
    const archives = await Blog.aggregate([
      { $match: { status: 'published' } },
      { 
        $group: { 
          _id: { 
            year: { $year: '$createdAt' }, 
            month: { $month: '$createdAt' } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);
    
    // Format archives for display
    const formattedArchives = archives.map(archive => ({
      year: archive._id.year,
      month: archive._id.month,
      monthName: moment().month(archive._id.month - 1).format('MMMM'),
      count: archive.count
    }));
    
    res.render('pages/blog/posts', {
      pageTitle: 'All Blog Posts',
      heroTitle: 'Voyageo Blog Posts',
      heroSubtitle: 'Explore our latest articles and travel guides',
      headerImagePath: '/images/headers/blog-posts-banner.jpg',
      posts,
      categories,
      archives: formattedArchives,
      pagination: {
        page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error rendering blog posts:', error);
    res.render('pages/error', {
      pageTitle: 'Error',
      heroTitle: 'Something Went Wrong',
      heroSubtitle: 'We apologize for the inconvenience',
      headerImagePath: '/images/headers/error-banner.jpg',
      message: 'Failed to load blog posts'
    });
  }
};

/**
 * Render single blog post with related content
 */
exports.renderBlogPost = async (req, res) => {
  try {
    // Find post by slug
    const post = await Blog.findOne({ 
      slug: req.params.slug,
      status: 'published'
    });
    
    if (!post) {
      return res.status(404).render('pages/404', {
        pageTitle: 'Post Not Found',
        heroTitle: 'Post Not Found',
        heroSubtitle: 'The blog post you were looking for doesn\'t exist',
        headerImagePath: '/images/headers/error-banner.jpg'
      });
    }
    
    // Increase view count
    post.viewCount += 1;
    await post.save();
    
    // Get related posts based on category and tags
    const relatedPosts = await Blog.find({
      _id: { $ne: post._id },
      status: 'published',
      $or: [
        { category: post.category },
        { tags: { $in: post.tags } }
      ]
    })
    .sort('-createdAt')
    .limit(3);
    
    // Get recent posts for sidebar
    const recentPosts = await Blog.find({ 
      status: 'published',
      _id: { $ne: post._id } 
    })
    .sort('-createdAt')
    .limit(5);
    
    // Get post tags
    const tags = post.tags || [];

    // Generate current URL for social sharing
    const currentUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    
    // Use post's featured image if available, otherwise default
    const headerImagePath = post.featuredImage 
      ? post.featuredImage 
      : '/images/headers/blog-post-banner.jpg';
    
    res.render('pages/blog-post', {
      pageTitle: post.title,
      heroTitle: post.title,
      heroSubtitle: post.excerpt,
      headerImagePath,
      post,
      relatedPosts,
      recentPosts,
      tags,
      currentUrl
    });
  } catch (error) {
    console.error('Error rendering blog post:', error);
    res.render('pages/error', {
      pageTitle: 'Error',
      heroTitle: 'Something Went Wrong',
      heroSubtitle: 'We apologize for the inconvenience',
      headerImagePath: '/images/headers/error-banner.jpg',
      message: 'Failed to load blog post'
    });
  }
};

/**
 * Render blog posts filtered by category
 */
exports.renderBlogsByCategory = async (req, res) => {
  try {
    const category = req.params.slug;
    const page = parseInt(req.query.page) || 1;
    const limit = 9; // Posts per page
    const skip = (page - 1) * limit;
    
    // Get posts in category
    const totalPosts = await Blog.countDocuments({ 
      status: 'published',
      category: category
    });
    
    if (totalPosts === 0) {
      return res.status(404).render('pages/404', {
        pageTitle: 'Category Not Found',
        heroTitle: 'Category Not Found',
        heroSubtitle: 'The blog category you were looking for doesn\'t exist or has no posts',
        headerImagePath: '/images/headers/error-banner.jpg'
      });
    }
    
    const totalPages = Math.ceil(totalPosts / limit);
    
    const posts = await Blog.find({ 
      status: 'published',
      category: category
    })
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);
    
    // Get all categories for sidebar
    const categories = await Blog.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.render('pages/blog/category', {
      pageTitle: `${category} - Blog Posts`,
      heroTitle: category,
      heroSubtitle: `Explore our blog posts in the ${category} category`,
      headerImagePath: '/images/headers/blog-category-banner.jpg',
      posts,
      currentCategory: category,
      categories,
      pagination: {
        page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error rendering category posts:', error);
    res.render('pages/error', {
      pageTitle: 'Error',
      heroTitle: 'Something Went Wrong',
      heroSubtitle: 'We apologize for the inconvenience',
      headerImagePath: '/images/headers/error-banner.jpg',
      message: 'Failed to load category posts'
    });
  }
};

/**
 * Render blog posts filtered by tag
 */
exports.renderBlogsByTag = async (req, res) => {
  try {
    const tag = req.params.slug;
    const page = parseInt(req.query.page) || 1;
    const limit = 9; // Posts per page
    const skip = (page - 1) * limit;
    
    // Get posts with tag
    const totalPosts = await Blog.countDocuments({ 
      status: 'published',
      tags: tag
    });
    
    if (totalPosts === 0) {
      return res.status(404).render('pages/404', {
        pageTitle: 'Tag Not Found',
        heroTitle: 'Tag Not Found',
        heroSubtitle: 'The blog tag you were looking for doesn\'t exist or has no posts',
        headerImagePath: '/images/headers/error-banner.jpg'
      });
    }
    
    const totalPages = Math.ceil(totalPosts / limit);
    
    const posts = await Blog.find({ 
      status: 'published',
      tags: tag
    })
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);
    
    // Get popular tags for sidebar
    const tags = await Blog.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 }
    ]);
    
    res.render('pages/blog/tag', {
      pageTitle: `${tag} - Blog Posts`,
      heroTitle: `Tag: ${tag}`,
      heroSubtitle: `Explore our blog posts tagged with ${tag}`,
      headerImagePath: '/images/headers/blog-tag-banner.jpg',
      posts,
      currentTag: tag,
      tags,
      pagination: {
        page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error rendering tag posts:', error);
    res.render('pages/error', {
      pageTitle: 'Error',
      heroTitle: 'Something Went Wrong',
      heroSubtitle: 'We apologize for the inconvenience',
      headerImagePath: '/images/headers/error-banner.jpg',
      message: 'Failed to load tagged posts'
    });
  }
};

/**
 * Render blog posts from specific month/year
 */
exports.renderBlogsByArchive = async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);
    
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(404).render('pages/404', {
        pageTitle: 'Invalid Archive',
        heroTitle: 'Invalid Archive',
        heroSubtitle: 'The archive date you requested is invalid',
        headerImagePath: '/images/headers/error-banner.jpg'
      });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = 9; // Posts per page
    const skip = (page - 1) * limit;
    
    // Create date range for the selected month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month
    
    // Get posts from time period
    const totalPosts = await Blog.countDocuments({ 
      status: 'published',
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    if (totalPosts === 0) {
      return res.status(404).render('pages/404', {
        pageTitle: 'Archive Empty',
        heroTitle: 'No Posts Found',
        heroSubtitle: 'There are no blog posts for the selected time period',
        headerImagePath: '/images/headers/error-banner.jpg'
      });
    }
    
    const totalPages = Math.ceil(totalPosts / limit);
    
    const posts = await Blog.find({ 
      status: 'published',
      createdAt: { $gte: startDate, $lte: endDate }
    })
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);
    
    // Format month name for display
    const monthName = moment().month(month - 1).format('MMMM');
    
    // Get archives for sidebar
    const archives = await Blog.aggregate([
      { $match: { status: 'published' } },
      { 
        $group: { 
          _id: { 
            year: { $year: '$createdAt' }, 
            month: { $month: '$createdAt' } 
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);
    
    // Format archives for display
    const formattedArchives = archives.map(archive => ({
      year: archive._id.year,
      month: archive._id.month,
      monthName: moment().month(archive._id.month - 1).format('MMMM'),
      count: archive.count
    }));
    
    res.render('pages/blog/archive', {
      pageTitle: `${monthName} ${year} - Blog Archive`,
      heroTitle: `${monthName} ${year}`,
      heroSubtitle: `Browse our blog posts from ${monthName} ${year}`,
      headerImagePath: '/images/headers/blog-archive-banner.jpg',
      posts,
      currentArchive: {
        year,
        month,
        monthName
      },
      archives: formattedArchives,
      pagination: {
        page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error rendering archive posts:', error);
    res.render('pages/error', {
      pageTitle: 'Error',
      heroTitle: 'Something Went Wrong',
      heroSubtitle: 'We apologize for the inconvenience',
      headerImagePath: '/images/headers/error-banner.jpg',
      message: 'Failed to load archive posts'
    });
  }
};

/**
 * Render search results
 */
exports.renderSearchResults = async (req, res) => {
  try {
    const query = req.query.q || '';
    
    if (!query || query.trim() === '') {
      return res.redirect('/blog');
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = 9; // Posts per page
    const skip = (page - 1) * limit;
    
    // Search in title, content, excerpt, and tags
    const searchRegex = new RegExp(query, 'i');
    
    const totalPosts = await Blog.countDocuments({
      status: 'published',
      $or: [
        { title: searchRegex },
        { content: searchRegex },
        { excerpt: searchRegex },
        { tags: searchRegex },
        { category: searchRegex }
      ]
    });
    
    const totalPages = Math.ceil(totalPosts / limit);
    
    const posts = await Blog.find({
      status: 'published',
      $or: [
        { title: searchRegex },
        { content: searchRegex },
        { excerpt: searchRegex },
        { tags: searchRegex },
        { category: searchRegex }
      ]
    })
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);
    
    res.render('pages/blog/search', {
      pageTitle: `Search Results for "${query}"`,
      heroTitle: 'Search Results',
      heroSubtitle: `Showing results for "${query}"`,
      headerImagePath: '/images/headers/blog-search-banner.jpg',
      posts,
      searchQuery: query,
      resultsCount: totalPosts,
      pagination: {
        page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error rendering search results:', error);
    res.render('pages/error', {
      pageTitle: 'Error',
      heroTitle: 'Something Went Wrong',
      heroSubtitle: 'We apologize for the inconvenience',
      headerImagePath: '/images/headers/error-banner.jpg',
      message: 'Failed to load search results'
    });
  }
}; 