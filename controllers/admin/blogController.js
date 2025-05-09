/**
 * Admin Blog Controller
 * 
 * Handles all admin-side blog operations using the service layer
 */

const blogService = require('../../services/blogService');
const uploadService = require('../../services/uploadService');
const config = require('../../config');

module.exports = {
  /**
   * Get all blog posts for admin dashboard
   */
  getAllPosts: async (req, res) => {
    try {
      const posts = await blogService.getAllPostsForAdmin();
      
      res.render('admin/blog/index', {
        pageTitle: 'Blog Management',
        activePage: 'blog',
        posts
      });
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      res.render('admin/error', {
        error: 'Failed to fetch blog posts',
        pageTitle: 'Error',
        activePage: 'blog'
      });
    }
  },

  /**
   * Show blog post creation form
   */
  getNewPostForm: async (req, res) => {
    res.render('admin/blog/new', {
      pageTitle: 'Create New Blog Post',
      activePage: 'blog',
      post: {
        title: '',
        content: '',
        excerpt: '',
        image: '',
        author: 'Admin',
        status: 'draft',
        category: 'Uncategorized',
        tags: [],
        seo: {
          metaTitle: '',
          metaDescription: '',
          keywords: []
        }
      }
    });
  },

  /**
   * Create a new blog post
   */
  createPost: async (req, res) => {
    try {
      // Handle file upload if present
      let imageUrl = req.body.image;
      
      if (req.file) {
        const uploadResult = await uploadService.uploadFile(req.file, {
          folder: 'blog',
          width: 1200,  // Max width for blog images
          height: 800,  // Max height for blog images
          quality: 85,
          format: 'jpeg'
        });
        
        imageUrl = uploadResult.url;
      }
      
      // Process SEO fields
      const seo = {
        metaTitle: req.body['seo.metaTitle'] || req.body.title,
        metaDescription: req.body['seo.metaDescription'] || req.body.excerpt.substring(0, 160),
        keywords: req.body['seo.keywords'] ? 
          (typeof req.body['seo.keywords'] === 'string' ? 
            req.body['seo.keywords'].split(',').map(k => k.trim()) : 
            req.body['seo.keywords']) : 
          [],
        ogImage: imageUrl
      };
      
      // Create post with processed data
      const postData = {
        ...req.body,
        image: imageUrl,
        seo
      };
      
      // Use the service to create the post
      await blogService.createPost(postData);
      
      res.redirect('/admin/blog');
    } catch (error) {
      console.error('Error creating blog post:', error);
      
      res.render('admin/blog/new', {
        pageTitle: 'Create New Blog Post',
        activePage: 'blog',
        error: error.message || 'Failed to create blog post',
        post: req.body
      });
    }
  },

  /**
   * Show edit form for a blog post
   */
  getEditPostForm: async (req, res) => {
    try {
      const post = await blogService.getPostById(req.params.id);
      
      if (!post) {
        return res.status(404).render('admin/error', {
          error: 'Blog post not found',
          pageTitle: 'Error',
          activePage: 'blog'
        });
      }
      
      res.render('admin/blog/edit', {
        pageTitle: 'Edit Blog Post',
        activePage: 'blog',
        post
      });
    } catch (error) {
      console.error('Error fetching blog post for edit:', error);
      res.render('admin/error', {
        error: 'Failed to fetch blog post',
        pageTitle: 'Error',
        activePage: 'blog'
      });
    }
  },

  /**
   * Update a blog post
   */
  updatePost: async (req, res) => {
    try {
      // Check if post exists
      const existingPost = await blogService.getPostById(req.params.id);
      
      if (!existingPost) {
        return res.status(404).render('admin/error', {
          error: 'Blog post not found',
          pageTitle: 'Error',
          activePage: 'blog'
        });
      }
      
      // Handle file upload if present
      let imageUrl = req.body.image || existingPost.image;
      
      if (req.file) {
        const uploadResult = await uploadService.uploadFile(req.file, {
          folder: 'blog',
          width: 1200,
          height: 800,
          quality: 85,
          format: 'jpeg'
        });
        
        imageUrl = uploadResult.url;
        
        // If replacing an image, delete the old one
        if (existingPost.image && existingPost.image !== '/images/blog/default.jpg') {
          await uploadService.deleteFile(existingPost.image);
        }
      }
      
      // Process SEO fields
      const seo = {
        metaTitle: req.body['seo.metaTitle'] || req.body.title,
        metaDescription: req.body['seo.metaDescription'] || req.body.excerpt.substring(0, 160),
        keywords: req.body['seo.keywords'] ? 
          (typeof req.body['seo.keywords'] === 'string' ? 
            req.body['seo.keywords'].split(',').map(k => k.trim()) : 
            req.body['seo.keywords']) : 
          [],
        ogImage: imageUrl
      };
      
      // Update post with processed data
      const postData = {
        ...req.body,
        image: imageUrl,
        seo
      };
      
      // Use the service to update the post
      await blogService.updatePost(req.params.id, postData);
      
      res.redirect('/admin/blog');
    } catch (error) {
      console.error('Error updating blog post:', error);
      
      res.render('admin/blog/edit', {
        pageTitle: 'Edit Blog Post',
        activePage: 'blog',
        error: error.message || 'Failed to update blog post',
        post: { ...req.body, _id: req.params.id }
      });
    }
  },

  /**
   * Delete a blog post
   */
  deletePost: async (req, res) => {
    try {
      // Get post to check for image
      const post = await blogService.getPostById(req.params.id);
      
      if (post && post.image && post.image !== '/images/blog/default.jpg') {
        // Delete the image file
        await uploadService.deleteFile(post.image);
      }
      
      // Delete the post
      await blogService.deletePost(req.params.id);
      
      // Return JSON for AJAX requests
      if (req.xhr) {
        return res.json({ 
          success: true, 
          message: 'Post deleted successfully' 
        });
      }
      
      res.redirect('/admin/blog');
    } catch (error) {
      console.error('Error deleting blog post:', error);
      
      // Return JSON for AJAX requests
      if (req.xhr) {
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to delete blog post' 
        });
      }
      
      res.status(500).render('admin/error', {
        error: 'Failed to delete blog post',
        pageTitle: 'Error',
        activePage: 'blog'
      });
    }
  },

  /**
   * Toggle post status (draft/published)
   */
  togglePostStatus: async (req, res) => {
    try {
      const updatedPost = await blogService.togglePostStatus(req.params.id);
      
      if (!updatedPost) {
        return res.status(404).json({ 
          success: false, 
          message: 'Blog post not found' 
        });
      }
      
      res.json({ 
        success: true, 
        message: `Post ${updatedPost.status === 'published' ? 'published' : 'unpublished'} successfully`,
        status: updatedPost.status
      });
    } catch (error) {
      console.error('Error toggling blog post status:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update post status' 
      });
    }
  },

  /**
   * Toggle featured status
   */
  toggleFeaturedStatus: async (req, res) => {
    try {
      const updatedPost = await blogService.toggleFeaturedStatus(req.params.id);
      
      if (!updatedPost) {
        return res.status(404).json({ 
          success: false, 
          message: 'Blog post not found' 
        });
      }
      
      res.json({ 
        success: true, 
        message: `Post ${updatedPost.featured ? 'featured' : 'unfeatured'} successfully`,
        featured: updatedPost.featured
      });
    } catch (error) {
      console.error('Error toggling blog post featured status:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update featured status' 
      });
    }
  },
  
  /**
   * Generate SEO fields for post
   */
  generateSeoFields: async (req, res) => {
    try {
      const post = await blogService.getPostById(req.params.id);
      
      if (!post) {
        return res.status(404).json({ 
          success: false, 
          message: 'Blog post not found' 
        });
      }
      
      // Generate SEO fields
      const updatedPost = post.generateSeoFields();
      await updatedPost.save();
      
      res.json({ 
        success: true, 
        message: 'SEO fields generated successfully',
        seo: updatedPost.seo
      });
    } catch (error) {
      console.error('Error generating SEO fields:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate SEO fields' 
      });
    }
  }
}; 