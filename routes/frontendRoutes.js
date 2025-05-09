const express = require('express');
// Import other existing controllers
// Add the blog frontend controller
const {
  renderBlogHome,
  renderBlogPosts,
  renderBlogPost,
  renderBlogsByCategory,
  renderBlogsByTag,
  renderBlogsByArchive,
  renderSearchResults
} = require('../controllers/frontendBlogController');

const router = express.Router();

// Keep existing routes

// Blog routes
router.get('/blog', renderBlogHome);
router.get('/blog/posts', renderBlogPosts);
router.get('/blog/category/:slug', renderBlogsByCategory);
router.get('/blog/tag/:slug', renderBlogsByTag);
router.get('/blog/archives/:year/:month', renderBlogsByArchive);
router.get('/blog/search', renderSearchResults);
router.get('/blog/:slug', renderBlogPost);

module.exports = router; 