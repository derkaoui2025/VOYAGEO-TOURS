const ExcursionBooking = require('../../models/ExcursionBooking');
const Excursion = require('../../models/Excursion');
const ExcelJS = require('exceljs');

/**
 * Get all excursion bookings with pagination and filtering options
 */
exports.getAllExcursionBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Filter options
    const filterOptions = {};
    
    if (req.query.status) {
      filterOptions.status = req.query.status;
    }
    
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filterOptions.$or = [
        { fullName: searchRegex },
        { email: searchRegex }
      ];
    }
    
    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      filterOptions.excursionDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    } else if (req.query.startDate) {
      filterOptions.excursionDate = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      filterOptions.excursionDate = { $lte: new Date(req.query.endDate) };
    }
    
    // Get total count for pagination
    const totalBookings = await ExcursionBooking.countDocuments(filterOptions);
    
    // Get bookings with pagination and populate excursion details
    const bookings = await ExcursionBooking.find(filterOptions)
      .sort({ excursionDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('excursionId', 'title slug price excursionType');
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalBookings / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    // Format booking data for display
    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      fullName: booking.fullName,
      email: booking.email,
      excursionName: booking.excursionId ? booking.excursionId.title : 'Unknown Excursion',
      excursionSlug: booking.excursionId ? booking.excursionId.slug : '',
      excursionType: booking.excursionId ? booking.excursionId.excursionType : '',
      excursionDate: booking.excursionDate,
      guestCount: booking.guestCount,
      status: booking.status,
      totalPrice: booking.totalPrice,
      createdAt: booking.createdAt
    }));
    
    res.render('admin/excursion-bookings/index', {
      pageTitle: 'Manage Excursion Bookings',
      activePage: 'excursion-bookings',
      bookings: formattedBookings,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalBookings,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        status: req.query.status || '',
        search: req.query.search || '',
        startDate: req.query.startDate || '',
        endDate: req.query.endDate || ''
      },
      success: req.query.success || null,
      error: null
    });
  } catch (error) {
    console.error('Error fetching excursion bookings:', error);
    res.render('admin/excursion-bookings/index', {
      pageTitle: 'Manage Excursion Bookings',
      activePage: 'excursion-bookings',
      bookings: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        hasNextPage: false,
        hasPrevPage: false
      },
      filters: {
        status: '',
        search: '',
        startDate: '',
        endDate: ''
      },
      error: 'Failed to load excursion bookings. Please try again.'
    });
  }
};

/**
 * Get excursion booking details
 */
exports.getBookingDetails = async (req, res) => {
  try {
    const booking = await ExcursionBooking.findById(req.params.id)
      .populate('excursionId');
    
    if (!booking) {
      return res.status(404).render('admin/error', {
        pageTitle: 'Booking Not Found',
        error: 'The excursion booking you are looking for does not exist',
        activePage: 'excursion-bookings'
      });
    }
    
    res.render('admin/excursion-bookings/details', {
      pageTitle: `Excursion Booking: ${booking.fullName}`,
      activePage: 'excursion-bookings',
      booking,
      success: req.query.success || null,
      error: null
    });
  } catch (error) {
    console.error('Error fetching excursion booking details:', error);
    res.status(500).render('admin/error', {
      pageTitle: 'Error',
      error: 'Failed to load excursion booking details',
      activePage: 'excursion-bookings'
    });
  }
};

/**
 * Update excursion booking status
 */
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    const booking = await ExcursionBooking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Excursion booking not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Excursion booking status updated successfully',
      booking
    });
  } catch (error) {
    console.error('Error updating excursion booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update excursion booking status'
    });
  }
};

/**
 * Delete excursion booking
 */
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await ExcursionBooking.findByIdAndDelete(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Excursion booking not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Excursion booking deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting excursion booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete excursion booking'
    });
  }
};

// Helper function to get status color for UI
function getStatusColor(status) {
  switch (status) {
    case 'pending':
      return 'text-yellow-600';
    case 'confirmed':
      return 'text-green-600';
    case 'completed':
      return 'text-blue-600';
    case 'cancelled':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

// Helper function to get status background color for UI
function getStatusBgColor(status) {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100';
    case 'confirmed':
      return 'bg-green-100';
    case 'completed':
      return 'bg-blue-100';
    case 'cancelled':
      return 'bg-red-100';
    default:
      return 'bg-gray-100';
  }
}

// Export these helper functions for use in the templates
exports.getStatusColor = getStatusColor;
exports.getStatusBgColor = getStatusBgColor; 