const ActivityBooking = require('../../models/ActivityBooking');
const Activity = require('../../models/Activity');

// Get all activity bookings
exports.getAllActivityBookings = async (req, res) => {
  try {
    const activityBookings = await ActivityBooking.find()
      .sort('-createdAt')
      .populate('activityId', 'title');
    
    res.render('admin/activity-bookings/index', {
      pageTitle: 'Activity Bookings',
      activePage: 'activity-bookings',
      activityBookings,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Error fetching activity bookings:', error);
    res.render('admin/activity-bookings/index', {
      pageTitle: 'Activity Bookings',
      activePage: 'activity-bookings',
      activityBookings: [],
      error: 'Failed to load activity bookings'
    });
  }
};

// Show activity booking details
exports.getActivityBookingDetails = async (req, res) => {
  try {
    const booking = await ActivityBooking.findById(req.params.id)
      .populate('activityId');
    
    if (!booking) {
      return res.redirect('/admin/activity-bookings?error=Booking not found');
    }
    
    res.render('admin/activity-bookings/show', {
      pageTitle: 'Booking Details',
      activePage: 'activity-bookings',
      booking,
      error: null
    });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.redirect('/admin/activity-bookings?error=Failed to load booking details');
  }
};

// Update activity booking status
exports.updateActivityBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const booking = await ActivityBooking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Update booking status
    booking.status = status;
    await booking.save();
    
    return res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      status: booking.status
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update booking status'
    });
  }
};

// Update activity booking payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;
    
    const booking = await ActivityBooking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Update payment status
    booking.paymentStatus = paymentStatus;
    await booking.save();
    
    return res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      paymentStatus: booking.paymentStatus
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update payment status'
    });
  }
};

// Delete activity booking
exports.deleteActivityBooking = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await ActivityBooking.findById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    await ActivityBooking.findByIdAndDelete(id);
    
    return res.status(200).json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete booking'
    });
  }
};

// Get activity booking statistics
exports.getActivityBookingStats = async (req, res) => {
  try {
    // Get total number of bookings
    const totalBookings = await ActivityBooking.countDocuments();
    
    // Get bookings by status
    const pendingBookings = await ActivityBooking.countDocuments({ status: 'pending' });
    const confirmedBookings = await ActivityBooking.countDocuments({ status: 'confirmed' });
    const cancelledBookings = await ActivityBooking.countDocuments({ status: 'cancelled' });
    
    // Get bookings by payment status
    const paidBookings = await ActivityBooking.countDocuments({ paymentStatus: 'paid' });
    const unpaidBookings = await ActivityBooking.countDocuments({ paymentStatus: 'unpaid' });
    const refundedBookings = await ActivityBooking.countDocuments({ paymentStatus: 'refunded' });
    
    // Get recent bookings
    const recentBookings = await ActivityBooking.find()
      .sort('-createdAt')
      .limit(5)
      .populate('activityId', 'title');
    
    // Get popular activities
    const popularActivities = await ActivityBooking.aggregate([
      { $group: { _id: '$activityId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Populate activity details
    const populatedActivities = await Promise.all(
      popularActivities.map(async (item) => {
        const activity = await Activity.findById(item._id);
        return {
          _id: item._id,
          title: activity ? activity.title : 'Unknown Activity',
          count: item.count
        };
      })
    );
    
    // Return data as JSON
    return res.status(200).json({
      success: true,
      data: {
        totalBookings,
        statusBreakdown: {
          pending: pendingBookings,
          confirmed: confirmedBookings,
          cancelled: cancelledBookings
        },
        paymentBreakdown: {
          paid: paidBookings,
          unpaid: unpaidBookings,
          refunded: refundedBookings
        },
        recentBookings,
        popularActivities: populatedActivities
      }
    });
  } catch (error) {
    console.error('Error getting booking stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get booking statistics'
    });
  }
}; 