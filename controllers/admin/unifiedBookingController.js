const UnifiedBooking = require('../../models/UnifiedBooking');
const Tour = require('../../models/Tour');
const Excursion = require('../../models/Excursion');
const Activity = require('../../models/Activity');
const Transfer = require('../../models/Transfer');
const mongoose = require('mongoose');
const moment = require('moment');
const excel = require('exceljs');
const path = require('path');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

/**
 * Get all bookings with filtering options
 */
exports.getAllBookings = async (req, res) => {
  try {
    // Handle error query parameter from redirects
    const errorMessage = req.query.error || null;
    
    console.log('Fetching all bookings with filters:', req.query);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const searchTerm = req.query.search || '';
    const bookingType = req.query.type || '';
    const status = req.query.status || '';
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate + 'T23:59:59') : null;

    // Build query
    let query = {};

    // Filter by booking type
    if (bookingType) {
      query.bookingType = bookingType;
    }

    // Filter by booking status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = { $gte: startDate };
    } else if (endDate) {
      query.date = { $lte: endDate };
    }

    // Search functionality
    if (searchTerm) {
      query.$or = [
        { fullName: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } },
        { itemName: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    console.log('MongoDB query:', JSON.stringify(query));

    // Execute query with pagination
    const bookings = await UnifiedBooking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log(`Found ${bookings.length} bookings for page ${page}`);

    // Get total count for pagination
    const total = await UnifiedBooking.countDocuments(query);
    console.log(`Total bookings matching query: ${total}`);

    // Calculate pagination details
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Provide booking type counts for the filter UI
    const typeCounts = await UnifiedBooking.aggregate([
      { $group: { _id: "$bookingType", count: { $sum: 1 } } }
    ]);

    // Provide status counts for the filter UI
    const statusCounts = await UnifiedBooking.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    res.render('admin/bookings/index', {
      pageTitle: 'Bookings',
      activePage: 'bookings',
      bookings,
      total,
      currentPage: page,
      totalPages,
      hasNextPage,
      hasPrevPage,
      limit,
      searchTerm,
      bookingType,
      status,
      startDate: startDate ? moment(startDate).format('YYYY-MM-DD') : '',
      endDate: endDate ? moment(endDate).format('YYYY-MM-DD') : '',
      typeCounts: typeCounts.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      statusCounts: statusCounts.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      query: req.query,
      error: errorMessage,
      success: req.query.success || null
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).render('admin/error', {
      pageTitle: 'Error',
      message: 'Failed to load bookings: ' + error.message,
      activePage: 'bookings'
    });
  }
};

/**
 * Get booking details
 */
exports.getBookingDetails = async (req, res) => {
  try {
    const bookingId = req.params.id;
    
    console.log('Received request for booking details with ID:', bookingId);
    
    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      console.error('Invalid booking ID format:', bookingId);
      return res.redirect('/admin/bookings?error=Invalid booking ID format');
    }
    
    console.log('Attempting to find booking with ID:', bookingId);
    const booking = await UnifiedBooking.findById(bookingId);
    
    if (!booking) {
      console.error('Booking not found with ID:', bookingId);
      return res.redirect('/admin/bookings?error=The booking with ID ' + bookingId + ' does not exist');
    }
    
    console.log('Booking found:', booking._id, booking.bookingType);

    // Get referenced item details
    let itemDetails = null;
    try {
      switch(booking.bookingType) {
        case 'tour':
          itemDetails = await Tour.findById(booking.itemId);
          break;
        case 'excursion':
          itemDetails = await Excursion.findById(booking.itemId);
          break;
        case 'activity':
          itemDetails = await Activity.findById(booking.itemId);
          break;
        case 'transfer':
          itemDetails = await Transfer.findById(booking.itemId);
          break;
      }
      
      if (!itemDetails) {
        console.warn(`Referenced ${booking.bookingType} with ID ${booking.itemId} not found`);
      } else {
        console.log(`Found referenced ${booking.bookingType} details:`, itemDetails._id);
      }
    } catch (itemError) {
      console.error(`Error fetching ${booking.bookingType} details:`, itemError);
    }
    
    console.log('Rendering booking details template with booking data');
    
    // Create a safe copy of booking data to ensure it's serializable
    const bookingData = JSON.parse(JSON.stringify(booking));
    
    res.render('admin/bookings/details', {
      pageTitle: `Booking: ${booking.fullName}`,
      activePage: 'bookings',
      booking: bookingData,
      itemDetails: itemDetails ? JSON.parse(JSON.stringify(itemDetails)) : null,
      success: req.query.success || null,
      error: null
    });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    return res.redirect('/admin/bookings?error=Error loading booking: ' + error.message);
  }
};

/**
 * Update booking status
 */
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;
    
    console.log('Updating booking status:', { id, status, paymentStatus });

    // Validate the booking ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('Invalid booking ID format:', id);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid booking ID format' 
      });
    }

    // Find and update the booking
    const booking = await UnifiedBooking.findById(id);
    
    if (!booking) {
      console.error('Booking not found with ID:', id);
      return res.status(404).json({ 
        success: false,
        message: 'Booking not found' 
      });
    }

    // Update the booking fields
    booking.status = status || booking.status;
    booking.paymentStatus = paymentStatus || booking.paymentStatus;
    booking.updatedAt = new Date();

    // Save the updated booking
    await booking.save();
    console.log('Booking updated successfully:', booking._id);

    // Return success response
    return res.json({ 
      success: true,
      message: 'Booking status updated successfully',
      data: {
        id: booking._id,
        status: booking.status,
        paymentStatus: booking.paymentStatus
      }
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    return res.status(500).json({ 
      success: false,
      message: 'An error occurred while updating booking status' 
    });
  }
};

/**
 * Delete booking
 */
exports.deleteBooking = async (req, res) => {
  try {
    console.log('Attempting to delete booking:', req.params.id);
    
    // Validate booking ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.error('Invalid booking ID format for deletion:', req.params.id);
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format'
      });
    }
    
    const booking = await UnifiedBooking.findByIdAndDelete(req.params.id);
    
    if (!booking) {
      console.error('Booking not found for deletion:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    console.log('Successfully deleted booking:', req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete booking: ' + error.message
    });
  }
};

/**
 * Export bookings as CSV
 */
exports.exportBookingsCsv = async (req, res) => {
  try {
    // Apply filters from query params
    const bookingType = req.query.type || '';
    const status = req.query.status || '';
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate + 'T23:59:59') : null;
    const searchTerm = req.query.search || '';

    // Build query
    let query = {};

    // Filter by booking type
    if (bookingType) {
      query.bookingType = bookingType;
    }

    // Filter by booking status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = { $gte: startDate };
    } else if (endDate) {
      query.date = { $lte: endDate };
    }

    // Search functionality
    if (searchTerm) {
      query.$or = [
        { fullName: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } },
        { itemName: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Get bookings
    const bookings = await UnifiedBooking.find(query).sort({ createdAt: -1 });

    // Create CSV file
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `bookings_export_${timestamp}.csv`;
    const filepath = path.join(__dirname, '../../public/exports', filename);

    // Ensure directory exists
    if (!fs.existsSync(path.join(__dirname, '../../public/exports'))) {
      fs.mkdirSync(path.join(__dirname, '../../public/exports'), { recursive: true });
    }

    // Configure CSV writer
    const csvWriter = createCsvWriter({
      path: filepath,
      header: [
        { id: 'id', title: 'Booking ID' },
        { id: 'type', title: 'Type' },
        { id: 'fullName', title: 'Full Name' },
        { id: 'email', title: 'Email' },
        { id: 'phone', title: 'Phone' },
        { id: 'itemName', title: 'Item' },
        { id: 'date', title: 'Date' },
        { id: 'numberOfPeople', title: 'People' },
        { id: 'totalPrice', title: 'Total Price ($)' },
        { id: 'status', title: 'Status' },
        { id: 'paymentStatus', title: 'Payment Status' },
        { id: 'createdAt', title: 'Created At' }
      ]
    });

    // Transform bookings data for CSV
    const records = bookings.map(booking => ({
      id: booking._id.toString(),
      type: booking.bookingType.charAt(0).toUpperCase() + booking.bookingType.slice(1),
      fullName: booking.fullName,
      email: booking.email,
      phone: booking.phone || 'N/A',
      itemName: booking.itemName,
      date: moment(booking.date).format('YYYY-MM-DD'),
      numberOfPeople: booking.numberOfPeople,
      totalPrice: booking.totalPrice,
      status: booking.status.charAt(0).toUpperCase() + booking.status.slice(1),
      paymentStatus: booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1),
      createdAt: moment(booking.createdAt).format('YYYY-MM-DD HH:mm:ss')
    }));

    // Write data to CSV
    await csvWriter.writeRecords(records);

    // Send file to client
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
      }
      
      // Clean up file after download
      fs.unlink(filepath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting temporary file:', unlinkErr);
        }
      });
    });
  } catch (error) {
    console.error('Error exporting bookings:', error);
    res.status(500).render('admin/error', {
      pageTitle: 'Error',
      error: 'Failed to export bookings',
      activePage: 'bookings'
    });
  }
};

/**
 * Export bookings as Excel
 */
exports.exportBookingsExcel = async (req, res) => {
  try {
    // Apply filters from query params
    const bookingType = req.query.type || '';
    const status = req.query.status || '';
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate + 'T23:59:59') : null;
    const searchTerm = req.query.search || '';

    // Build query
    let query = {};

    // Filter by booking type
    if (bookingType) {
      query.bookingType = bookingType;
    }

    // Filter by booking status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = { $gte: startDate };
    } else if (endDate) {
      query.date = { $lte: endDate };
    }

    // Search functionality
    if (searchTerm) {
      query.$or = [
        { fullName: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } },
        { itemName: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Get bookings
    const bookings = await UnifiedBooking.find(query).sort({ createdAt: -1 });

    // Create Excel workbook
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Bookings');

    // Add columns
    worksheet.columns = [
      { header: 'Booking ID', key: 'id', width: 28 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Full Name', key: 'fullName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 20 },
      { header: 'Item', key: 'itemName', width: 40 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'People', key: 'numberOfPeople', width: 10 },
      { header: 'Total Price ($)', key: 'totalPrice', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Payment Status', key: 'paymentStatus', width: 15 },
      { header: 'Created At', key: 'createdAt', width: 20 },
    ];

    // Add header row style
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }
    };
    worksheet.getRow(1).font = {
      color: { argb: 'FFFFFFFF' },
      bold: true
    };

    // Add data
    bookings.forEach(booking => {
      worksheet.addRow({
        id: booking._id.toString(),
        type: booking.bookingType.charAt(0).toUpperCase() + booking.bookingType.slice(1),
        fullName: booking.fullName,
        email: booking.email,
        phone: booking.phone || 'N/A',
        itemName: booking.itemName,
        date: moment(booking.date).format('YYYY-MM-DD'),
        numberOfPeople: booking.numberOfPeople,
        totalPrice: booking.totalPrice,
        status: booking.status.charAt(0).toUpperCase() + booking.status.slice(1),
        paymentStatus: booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1),
        createdAt: moment(booking.createdAt).format('YYYY-MM-DD HH:mm:ss')
      });
    });

    // Format each row
    for (let i = 2; i <= bookings.length + 1; i++) {
      const row = worksheet.getRow(i);
      
      // Apply alternating row colors
      if (i % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' }
        };
      }
      
      // Format date cells
      worksheet.getCell(`G${i}`).numFmt = 'yyyy-mm-dd';
      
      // Format number cells
      worksheet.getCell(`H${i}`).numFmt = '0';
      worksheet.getCell(`I${i}`).numFmt = '#,##0.00';
      
      // Add color to status cells
      const statusCell = worksheet.getCell(`J${i}`);
      const paymentStatusCell = worksheet.getCell(`K${i}`);
      
      // Set status cell colors
      if (statusCell.value === 'Confirmed') {
        statusCell.font = { color: { argb: 'FF00AA00' } };
      } else if (statusCell.value === 'Cancelled') {
        statusCell.font = { color: { argb: 'FFFF0000' } };
      } else if (statusCell.value === 'Completed') {
        statusCell.font = { color: { argb: 'FF0000AA' } };
      }
      
      // Set payment status cell colors
      if (paymentStatusCell.value === 'Paid') {
        paymentStatusCell.font = { color: { argb: 'FF00AA00' } };
      } else if (paymentStatusCell.value === 'Refunded') {
        paymentStatusCell.font = { color: { argb: 'FFFF0000' } };
      }
    }

    // Generate Excel file
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `bookings_export_${timestamp}.xlsx`;
    const filepath = path.join(__dirname, '../../public/exports', filename);

    // Ensure directory exists
    if (!fs.existsSync(path.join(__dirname, '../../public/exports'))) {
      fs.mkdirSync(path.join(__dirname, '../../public/exports'), { recursive: true });
    }

    // Write Excel file
    await workbook.xlsx.writeFile(filepath);

    // Send file to client
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
      }
      
      // Clean up file after download
      fs.unlink(filepath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting temporary file:', unlinkErr);
        }
      });
    });
  } catch (error) {
    console.error('Error exporting bookings to Excel:', error);
    res.status(500).render('admin/error', {
      pageTitle: 'Error',
      error: 'Failed to export bookings to Excel',
      activePage: 'bookings'
    });
  }
}; 