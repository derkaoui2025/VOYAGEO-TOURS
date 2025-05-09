const express = require('express');
const router = express.Router();

// Import models
const Tour = require('../models/Tour');
const Booking = require('../models/Booking');
const CustomTour = require('../models/CustomTour');
const User = require('../models/User');

// Import middleware
const isAdmin = require('../middleware/isAdmin');

// Import controllers for bookings
const bookingController = require('../controllers/admin/bookingController');

// GET /admin/login - Display login form
router.get('/login', (req, res) => {
  // If already logged in, redirect to dashboard
  if (req.session && req.session.isAdmin) {
    return res.redirect('/admin/dashboard');
  }
  
  // Display login form
  res.render('admin/login', {
    error: req.query.error || null
  });
});

// POST /admin/login - Handle login form submission
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // Validate credentials against environment variables
  if (username === process.env.ADMIN_USERNAME && 
      password === process.env.ADMIN_PASSWORD) {
    
    // Set admin session
    req.session.isAdmin = true;
    req.session.adminUsername = username;
    
    // Redirect to dashboard
    return res.redirect('/admin/dashboard');
  }
  
  // Invalid credentials, redirect back to login with error
  return res.redirect('/admin/login?error=Invalid username or password');
});

// GET /admin/logout - Log out admin
router.get('/logout', (req, res) => {
  // Destroy session
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    // Redirect to login page
    res.redirect('/admin/login');
  });
});

// GET /admin/dashboard - Admin dashboard
router.get('/dashboard', isAdmin, async (req, res) => {
  try {
    // Get statistics
    const stats = {
      tours: await Tour.countDocuments(),
      bookings: await Booking.countDocuments(),
      customTours: await CustomTour.countDocuments(),
      users: await User.countDocuments()
    };
    
    // Get recent bookings (limit to 5)
    const recentBookings = await Booking.find()
      .sort('-createdAt')
      .limit(5)
      .populate('tourId', 'title');
    
    // Format booking data for display
    const formattedBookings = recentBookings.map(booking => ({
      _id: booking._id,
      fullName: booking.fullName,
      email: booking.email,
      tourName: booking.tourId ? booking.tourId.title : 'Unknown Tour',
      tourDate: booking.tourDate,
      guestCount: booking.guestCount,
      status: booking.status
    }));
    
    // Get popular tours based on booking count
    const popularTours = await Tour.aggregate([
      { $lookup: { from: 'bookings', localField: '_id', foreignField: 'tourId', as: 'tourBookings' } },
      { $addFields: { bookingCount: { $size: '$tourBookings' } } },
      { $sort: { bookingCount: -1 } },
      { $limit: 5 },
      { $project: { name: '$title', bookings: '$bookingCount', rating: { $ifNull: ['$rating', 4.5] } } }
    ]);
    
    // Mock activity data (in a real app, this would come from an activity log)
    const recentActivity = [
      {
        type: 'tour',
        icon: 'fas fa-map-marked-alt',
        text: 'New tour "Desert Adventure" was created',
        time: '2 hours ago'
      },
      {
        type: 'booking',
        icon: 'fas fa-calendar-check',
        text: 'New booking from John Doe for "Marrakech Explorer"',
        time: '5 hours ago'
      },
      {
        type: 'user',
        icon: 'fas fa-user',
        text: 'New user registration: sarah@example.com',
        time: '1 day ago'
      },
      {
        type: 'system',
        icon: 'fas fa-cog',
        text: 'System update completed successfully',
        time: '2 days ago'
      }
    ];
    
    // Check for query parameter to use modern layout
    const useModernLayout = req.query.modern === 'true';
    
    if (useModernLayout) {
      // Use modern layout
      res.render('admin/dashboard-modern', {
        pageTitle: 'Dashboard',
        activePage: 'dashboard',
        stats,
        recentBookings: formattedBookings,
        recentActivity,
        popularTours,
        success: req.query.success,
        error: null,
        layout: 'admin/layout-modern'
      });
    } else {
      // Use traditional layout
      res.render('admin/dashboard', {
        pageTitle: 'Dashboard',
        activePage: 'dashboard',
        stats,
        recentBookings: formattedBookings,
        recentActivity,
        popularTours,
        success: req.query.success,
        error: null
      });
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
    res.render('admin/dashboard', {
      pageTitle: 'Dashboard',
      activePage: 'dashboard',
      stats: {},
      recentBookings: [],
      recentActivity: [],
      popularTours: [],
      error: 'Error loading dashboard data'
    });
  }
});

// Booking Routes
router.get('/bookings', isAdmin, bookingController.getAllBookings);
router.get('/bookings/export', isAdmin, bookingController.exportBookingsCsv);
router.get('/bookings/export-excel', isAdmin, bookingController.exportBookingsExcel);
router.get('/bookings/:id', isAdmin, bookingController.getBookingDetails);
router.post('/bookings/:id/status', isAdmin, bookingController.updateBookingStatus);
router.delete('/bookings/:id', isAdmin, bookingController.deleteBooking);

// Custom Tours Routes
router.get('/custom-tours', isAdmin, async (req, res) => {
  try {
    const customTours = await CustomTour.find().sort('-createdAt');
    
    res.render('admin/custom-tours/index', {
      pageTitle: 'Custom Tour Requests',
      activePage: 'custom-tours',
      customTours,
      success: req.query.success,
      error: null
    });
  } catch (error) {
    console.error('Error fetching custom tour requests:', error);
    res.render('admin/custom-tours/index', {
      pageTitle: 'Custom Tour Requests',
      activePage: 'custom-tours',
      customTours: [],
      error: 'Failed to load custom tour requests'
    });
  }
});

router.get('/custom-tours/:id', isAdmin, async (req, res) => {
  try {
    const customTour = await CustomTour.findById(req.params.id);
    
    if (!customTour) {
      return res.status(404).render('admin/error', {
        message: 'Custom tour request not found'
      });
    }
    
    res.render('admin/custom-tours/show', {
      pageTitle: 'Custom Tour Request Details',
      activePage: 'custom-tours',
      customTour,
      success: req.query.success
    });
  } catch (error) {
    console.error('Error fetching custom tour request:', error);
    return res.status(500).render('admin/error', {
      message: 'Failed to load custom tour request details'
    });
  }
});

router.post('/custom-tours/:id/status', isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'reviewed', 'contacted', 'completed', 'rejected'].includes(status)) {
      return res.status(400).render('admin/error', {
        message: 'Invalid status'
      });
    }
    
    const customTour = await CustomTour.findById(req.params.id);
    
    if (!customTour) {
      return res.status(404).render('admin/error', {
        message: 'Custom tour request not found'
      });
    }
    
    customTour.status = status;
    await customTour.save();
    
    return res.redirect(`/admin/custom-tours/${customTour._id}?success=Status updated successfully`);
  } catch (error) {
    console.error('Error updating custom tour status:', error);
    return res.status(500).render('admin/error', {
      message: 'Failed to update custom tour status'
    });
  }
});

router.post('/custom-tours/:id/delete', isAdmin, async (req, res) => {
  try {
    const customTour = await CustomTour.findById(req.params.id);
    
    if (!customTour) {
      return res.status(404).render('admin/error', {
        message: 'Custom tour request not found'
      });
    }
    
    await customTour.deleteOne();
    
    return res.redirect('/admin/custom-tours?success=Custom tour request deleted successfully');
  } catch (error) {
    console.error('Error deleting custom tour request:', error);
    return res.status(500).render('admin/error', {
      message: 'Failed to delete custom tour request'
    });
  }
});

module.exports = router; 