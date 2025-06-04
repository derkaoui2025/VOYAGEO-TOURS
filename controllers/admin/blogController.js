/**
 * Admin Blog Controller
 * 
 * Handles all admin-side blog operations using the service layer
 */

const blogService = require('../../services/blogService');
const { cloudinary } = require('../../config/cloudinary');
const Blog = require('../../models/Blog'); // Add the direct Blog model import

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
        posts,
        success: req.query.success || null,
        error: null
      });
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      res.render('admin/error', {
        message: 'Failed to fetch blog posts',
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
      },
      success: null,
      error: null
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
        // The image has already been uploaded to Cloudinary by the middleware
        imageUrl = req.file.path; // Cloudinary secure_url is set to the path property
        console.log('Uploaded image URL:', imageUrl);
      }
      
      // Process tags
      const tags = req.body.tags ? 
        (typeof req.body.tags === 'string' ? 
          req.body.tags.split(',').map(t => t.trim()) : 
          req.body.tags) : 
        [];
      
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
        tags,
        seo
      };
      
      // Use the service to create the post
      const newPost = await blogService.createPost(postData);
      
      // Handle AJAX requests
      if (req.xhr) {
        return res.json({
          success: true,
          message: 'Blog post created successfully',
          post: newPost
        });
      }
      
      res.redirect('/admin/blog');
    } catch (error) {
      console.error('Error creating blog post:', error);
      
      // Handle AJAX requests
      if (req.xhr) {
        return res.status(500).json({
          success: false,
          message: error.message || 'Failed to create blog post'
        });
      }
      
      res.render('admin/blog/new', {
        pageTitle: 'Create New Blog Post',
        activePage: 'blog',
        error: error.message || 'Failed to create blog post',
        post: {
          ...req.body,
          tags: req.body.tags ? req.body.tags.split(',').map(t => t.trim()) : [],
          seo: {
            metaTitle: req.body['seo.metaTitle'] || '',
            metaDescription: req.body['seo.metaDescription'] || '',
            keywords: req.body['seo.keywords'] ? req.body['seo.keywords'].split(',').map(k => k.trim()) : []
          }
        }
      });
    }
  },

  /**
   * Show edit form for a blog post
   */
  getEditPostForm: async (req, res) => {
    try {
      // Use Blog model directly instead of using a non-existent service method
      const post = await Blog.findById(req.params.id);
      
      if (!post) {
        return res.status(404).render('admin/error', {
          message: 'Blog post not found', // Use 'message' instead of 'error'
          pageTitle: 'Error',
          activePage: 'blog'
        });
      }
      
      res.render('admin/blog/edit', {
        pageTitle: 'Edit Blog Post',
        activePage: 'blog',
        post,
        success: req.query.success || null,
        error: null
      });
    } catch (error) {
      console.error('Error fetching blog post for edit:', error);
      res.render('admin/error', {
        message: 'Failed to fetch blog post', // Use 'message' instead of 'error'
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
      // Check if post exists - use Blog model directly
      const existingPost = await Blog.findById(req.params.id);
      
      if (!existingPost) {
        return res.status(404).render('admin/error', {
          message: 'Blog post not found', // Use 'message' instead of 'error'
          pageTitle: 'Error',
          activePage: 'blog'
        });
      }
      
      // Handle file upload if present
      let imageUrl = req.body.image || existingPost.image;
      
      if (req.file) {
        // The image has already been uploaded to Cloudinary by the middleware
        imageUrl = req.file.path; // Cloudinary secure_url is set to the path property
        console.log('Updated image URL:', imageUrl);
        
        // If replacing an image, delete the old one
        if (existingPost.image && existingPost.image !== '/images/blog/default.jpg') {
          try {
            // Extract the public ID from the Cloudinary URL
            // Example: https://res.cloudinary.com/your-cloud/image/upload/v1234567890/voyageo-tours/blog/image-id.webp
            const urlParts = existingPost.image.split('/');
            const publicIdWithExtension = urlParts[urlParts.length - 1];
            const publicId = `voyageo-tours/blog/${publicIdWithExtension.split('.')[0]}`;
            
            console.log('Deleting image with public ID:', publicId);
            
            // Use Cloudinary's API directly for deletion
            await cloudinary.uploader.destroy(publicId);
          } catch (deleteError) {
            console.error('Error deleting old image (non-critical):', deleteError);
          }
        }
      }
      
      // Process tags
      const tags = req.body.tags ? 
        (typeof req.body.tags === 'string' ? 
          req.body.tags.split(',').map(t => t.trim()) : 
          req.body.tags) : 
        [];
      
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
        tags,
        seo
      };
      
      // Use the service to update the post
      const updatedPost = await blogService.updatePost(req.params.id, postData);
      
      // Handle AJAX requests
      if (req.xhr) {
        return res.json({
          success: true,
          message: 'Blog post updated successfully',
          post: updatedPost
        });
      }
      
      res.redirect('/admin/blog');
    } catch (error) {
      console.error('Error updating blog post:', error);
      
      // Handle AJAX requests
      if (req.xhr) {
        return res.status(500).json({
          success: false,
          message: error.message || 'Failed to update blog post'
        });
      }
      
      res.render('admin/blog/edit', {
        pageTitle: 'Edit Blog Post',
        activePage: 'blog',
        error: error.message || 'Failed to update blog post',
        post: { 
          ...req.body, 
          _id: req.params.id,
          tags: req.body.tags ? req.body.tags.split(',').map(t => t.trim()) : [],
          seo: {
            metaTitle: req.body['seo.metaTitle'] || '',
            metaDescription: req.body['seo.metaDescription'] || '',
            keywords: req.body['seo.keywords'] ? req.body['seo.keywords'].split(',').map(k => k.trim()) : []
          }
        }
      });
    }
  },

  /**
   * Delete a blog post
   */
  deletePost: async (req, res) => {
    try {
      // Get post to check for image - use Blog model directly
      const post = await Blog.findById(req.params.id);
      
      if (post && post.image && post.image !== '/images/blog/default.jpg') {
        // Delete the image file
        await cloudinary.uploader.destroy(post.image);
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
        message: 'Failed to delete blog post',
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