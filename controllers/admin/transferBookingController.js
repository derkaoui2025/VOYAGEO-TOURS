const TransferBooking = require('../../models/TransferBooking');
const Transfer = require('../../models/Transfer');

// Get all transfer bookings
exports.getAllTransferBookings = async (req, res) => {
  try {
    // Get all bookings and populate the transfer info
    const bookings = await TransferBooking.find()
      .populate('transferId')
      .sort('-createdAt');

    res.render('admin/transfer-bookings/index', {
      pageTitle: 'Transfer Bookings',
      activePage: 'transfer-bookings',
      bookings,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Error fetching transfer bookings:', error);
    res.render('admin/transfer-bookings/index', {
      pageTitle: 'Transfer Bookings',
      activePage: 'transfer-bookings',
      bookings: [],
      error: 'Failed to load transfer bookings'
    });
  }
};

// Get transfer booking details
exports.getTransferBookingDetails = async (req, res) => {
  try {
    const booking = await TransferBooking.findById(req.params.id)
      .populate('transferId');

    if (!booking) {
      return res.redirect('/admin/transfer-bookings?error=Booking not found');
    }

    res.render('admin/transfer-bookings/details', {
      pageTitle: 'Booking Details',
      activePage: 'transfer-bookings',
      booking
    });
  } catch (error) {
    console.error('Error fetching transfer booking details:', error);
    res.redirect('/admin/transfer-bookings?error=Failed to load booking details');
  }
};

// Update transfer booking status
exports.updateTransferBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const booking = await TransferBooking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    booking.status = status;
    await booking.save();
    
    return res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      booking
    });
  } catch (error) {
    console.error('Error updating transfer booking status:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update booking status'
    });
  }
};

// Delete transfer booking
exports.deleteTransferBooking = async (req, res) => {
  try {
    const booking = await TransferBooking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    await TransferBooking.findByIdAndDelete(req.params.id);
    
    return res.status(200).json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting transfer booking:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete booking'
    });
  }
};

// Get transfer booking dashboard stats
exports.getTransferBookingStats = async (req, res) => {
  try {
    // Count bookings by status
    const pendingCount = await TransferBooking.countDocuments({ status: 'pending' });
    const confirmedCount = await TransferBooking.countDocuments({ status: 'confirmed' });
    const completedCount = await TransferBooking.countDocuments({ status: 'completed' });
    const cancelledCount = await TransferBooking.countDocuments({ status: 'cancelled' });
    
    // Get recent bookings
    const recentBookings = await TransferBooking.find()
      .populate('transferId', 'startCity endCity')
      .sort('-createdAt')
      .limit(5);
    
    return res.status(200).json({
      success: true,
      stats: {
        pending: pendingCount,
        confirmed: confirmedCount,
        completed: completedCount,
        cancelled: cancelledCount,
        total: pendingCount + confirmedCount + completedCount + cancelledCount
      },
      recentBookings
    });
  } catch (error) {
    console.error('Error fetching transfer booking stats:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch booking stats'
    });
  }
}; 