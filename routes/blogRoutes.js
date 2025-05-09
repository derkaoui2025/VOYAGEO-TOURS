const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/isAdmin');
const blogController = require('../controllers/blogController');

// Admin blog routes (all protected by isAdmin middleware)

// GET /admin/blog - View all blog posts
router.get('/', isAdmin, blogController.getAllPosts);

// GET /admin/blog/new - Show blog post creation form
router.get('/new', isAdmin, blogController.getNewPostForm);

// POST /admin/blog - Create a new blog post
router.post('/', isAdmin, blogController.createPost);

// GET /admin/blog/:id/edit - Show blog post edit form
router.get('/:id/edit', isAdmin, blogController.getEditPostForm);

// POST /admin/blog/:id - Update a blog post
router.post('/:id', isAdmin, blogController.updatePost);

// POST /admin/blog/:id/delete - Delete a blog post
router.post('/:id/delete', isAdmin, blogController.deletePost);

// POST /admin/blog/:id/toggle-status - Toggle post status (draft/published)
router.post('/:id/toggle-status', isAdmin, blogController.togglePostStatus);

// POST /admin/blog/:id/toggle-featured - Toggle featured status
router.post('/:id/toggle-featured', isAdmin, blogController.toggleFeaturedStatus);

module.exports = router; 