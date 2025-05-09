/**
 * isAdmin middleware - Checks if the user is authenticated as an admin
 */
const isAdmin = (req, res, next) => {
  // Check if user is authenticated (has valid admin session)
  if (req.session && req.session.isAdmin) {
    // User is authenticated as admin
    return next();
  }
  
  // Not authenticated, redirect to login
  return res.redirect('/admin/login');
};

module.exports = isAdmin; 