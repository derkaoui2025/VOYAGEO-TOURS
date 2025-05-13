const Activity = require('../models/Activity');
const ActivityBooking = require('../models/ActivityBooking');

// Get all published activities for the activities page
exports.getAllActivities = async (req, res) => {
  try {
    const activities = await Activity.find().sort('title');
    
    res.render('pages/activities', {
      pageTitle: 'Activities in Morocco',
      heroTitle: 'Discover Local Activities',
      heroSubtitle: 'Experience authentic Moroccan culture',
      headerImagePath: '/images/headers/activities-banner.jpg',
      activities
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).render('pages/error', {
      pageTitle: 'Error',
      heroTitle: 'Something Went Wrong',
      heroSubtitle: 'We apologize for the inconvenience',
      headerImagePath: '/images/headers/error-banner.jpg',
      message: 'Failed to load activities',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single activity by slug
exports.getActivityBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const activity = await Activity.findOne({ slug });
    
    if (!activity) {
      return res.status(404).render('pages/404', {
        pageTitle: 'Activity Not Found',
        heroTitle: 'Activity Not Found',
        heroSubtitle: 'The activity you were looking for doesn\'t exist',
        headerImagePath: '/images/headers/error-banner.jpg'
      });
    }
    
    // Fetch other activities (excluding the current one) to show as recommendations
    const otherActivities = await Activity.find({ 
      _id: { $ne: activity._id } 
    })
    .sort('-createdAt')
    .limit(3);
    
    // Use activity's image as header if available, otherwise default
    const headerImagePath = activity.image 
      ? activity.image 
      : '/images/headers/activity-details-banner.jpg';
    
    res.render('pages/activity-single', {
      pageTitle: activity.title,
      heroTitle: activity.title,
      heroSubtitle: `${activity.duration} ${activity.durationType} activity in ${activity.location || 'Morocco'}`,
      headerImagePath,
      activity,
      otherActivities
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).render('pages/error', {
      pageTitle: 'Error',
      heroTitle: 'Something Went Wrong',
      heroSubtitle: 'We apologize for the inconvenience',
      headerImagePath: '/images/headers/error-banner.jpg',
      message: 'Failed to load activity details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Process activity booking form
exports.bookActivity = async (req, res) => {
  try {
    const { activityId, fullName, email, phone, activityDate, guestCount, specialRequests } = req.body;
    
    // Find the activity to get its price
    const activity = await Activity.findById(activityId);
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    // Calculate total price
    const totalPrice = activity.price * guestCount;
    
    // Create new booking
    const booking = new ActivityBooking({
      activityId,
      fullName,
      email,
      phone,
      activityDate,
      guestCount,
      specialRequests,
      totalPrice,
      status: 'pending',
      paymentStatus: 'unpaid'
    });
    
    // Save booking
    await booking.save();
    
    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create booking'
    });
  }
}; 