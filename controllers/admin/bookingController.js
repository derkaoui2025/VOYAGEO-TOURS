const Booking = require('../../models/Booking');
const Tour = require('../../models/Tour');
const ExcelJS = require('exceljs');

/**
 * Get all bookings with pagination and filtering options
 */
exports.getAllBookings = async (req, res) => {
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
      filterOptions.tourDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    } else if (req.query.startDate) {
      filterOptions.tourDate = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      filterOptions.tourDate = { $lte: new Date(req.query.endDate) };
    }
    
    // Get total count for pagination
    const totalBookings = await Booking.countDocuments(filterOptions);
    
    // Get bookings with pagination and populate tour details
    const bookings = await Booking.find(filterOptions)
      .sort({ tourDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('tourId', 'title slug price');
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalBookings / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    // Format booking data for display
    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      fullName: booking.fullName,
      email: booking.email,
      tourName: booking.tourId ? booking.tourId.title : 'Unknown Tour',
      tourSlug: booking.tourId ? booking.tourId.slug : '',
      tourDate: booking.tourDate,
      guestCount: booking.guestCount,
      status: booking.status,
      totalPrice: booking.totalPrice,
      createdAt: booking.createdAt
    }));
    
    res.render('admin/bookings/index', {
      pageTitle: 'Manage Bookings',
      activePage: 'bookings',
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
    console.error('Error fetching bookings:', error);
    res.render('admin/bookings/index', {
      pageTitle: 'Manage Bookings',
      activePage: 'bookings',
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
      error: 'Failed to load bookings. Please try again.'
    });
  }
};

/**
 * Get booking details
 */
exports.getBookingDetails = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('tourId');
    
    if (!booking) {
      return res.status(404).render('admin/error', {
        pageTitle: 'Booking Not Found',
        error: 'The booking you are looking for does not exist',
        activePage: 'bookings'
      });
    }
    
    res.render('admin/bookings/details', {
      pageTitle: `Booking: ${booking.fullName}`,
      activePage: 'bookings',
      booking,
      success: req.query.success || null,
      error: null
    });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).render('admin/error', {
      pageTitle: 'Error',
      error: 'Failed to load booking details',
      activePage: 'bookings'
    });
  }
};

/**
 * Update booking status
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
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      booking
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status'
    });
  }
};

/**
 * Delete booking
 */
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete booking'
    });
  }
};

/**
 * Export bookings as CSV
 */
exports.exportBookingsCsv = async (req, res) => {
  try {
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
      filterOptions.tourDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    } else if (req.query.startDate) {
      filterOptions.tourDate = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      filterOptions.tourDate = { $lte: new Date(req.query.endDate) };
    }
    
    // Get bookings with filter
    const bookings = await Booking.find(filterOptions)
      .sort({ tourDate: -1 })
      .populate('tourId', 'title');
    
    // Generate CSV headers - removed ID and Created At columns
    let csv = 'Full Name,Email,Tour,Tour Date,Guest Count,Total Price,Status\n';
    
    // Generate CSV rows
    bookings.forEach(booking => {
      // Format tour date properly with local date string
      const tourDate = new Date(booking.tourDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      // Get tour name
      const tourName = booking.tourId ? booking.tourId.title.replace(/,/g, ' -') : 'Unknown Tour';
      
      // Format status with proper capitalization
      const status = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
      
      // Create CSV row with quotes around values to handle commas
      csv += `"${booking.fullName.replace(/"/g, '""')}","${booking.email}","${tourName}","${tourDate}",${booking.guestCount},$${booking.totalPrice.toFixed(2)},"${status}"\n`;
    });
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=voyageo-bookings-${new Date().toISOString().split('T')[0]}.csv`);
    
    // Send CSV data
    res.status(200).send(csv);
  } catch (error) {
    console.error('Error exporting bookings:', error);
    res.status(500).send('Error generating CSV file');
  }
};

/**
 * Export bookings as Excel (XLSX)
 */
exports.exportBookingsExcel = async (req, res) => {
  try {
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
      filterOptions.tourDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    } else if (req.query.startDate) {
      filterOptions.tourDate = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      filterOptions.tourDate = { $lte: new Date(req.query.endDate) };
    }
    
    // Get bookings with filter
    const bookings = await Booking.find(filterOptions)
      .sort({ tourDate: -1 })
      .populate('tourId', 'title');
    
    // Get total counts by status for summary
    const statusCounts = {
      pending: await Booking.countDocuments({ ...filterOptions, status: 'pending' }),
      confirmed: await Booking.countDocuments({ ...filterOptions, status: 'confirmed' }),
      completed: await Booking.countDocuments({ ...filterOptions, status: 'completed' }),
      cancelled: await Booking.countDocuments({ ...filterOptions, status: 'cancelled' })
    };
    
    // Calculate total revenue
    let totalRevenue = 0;
    bookings.forEach(booking => {
      if (booking.status !== 'cancelled') {
        totalRevenue += booking.totalPrice;
      }
    });

    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    
    // Set workbook properties
    workbook.creator = 'Voyageo Tours';
    workbook.lastModifiedBy = 'Voyageo Tours';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.properties.date1904 = true;
    
    // Add a worksheet
    const worksheet = workbook.addWorksheet('Bookings', {
      properties: {
        tabColor: { argb: 'FF9800' }
      },
      pageSetup: {
        paperSize: 9,
        orientation: 'landscape',
        fitToPage: true
      }
    });
    
    // Set column widths
    worksheet.columns = [
      { header: 'Full Name', key: 'fullName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Tour', key: 'tour', width: 35 },
      { header: 'Tour Date', key: 'tourDate', width: 15 },
      { header: 'Guest Count', key: 'guestCount', width: 12 },
      { header: 'Total Price', key: 'totalPrice', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
    ];
    
    // Add company header row and merge cells
    worksheet.addRow([]);
    const companyRow = worksheet.addRow(['VOYAGEO TOURS']);
    worksheet.mergeCells('A2:G2');
    companyRow.height = 30;
    companyRow.getCell(1).font = { 
      name: 'Arial Black', 
      size: 24, 
      bold: true, 
      color: { argb: 'FFFFFF' } 
    };
    companyRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF9800' }
    };
    companyRow.getCell(1).alignment = { 
      horizontal: 'center', 
      vertical: 'middle' 
    };
    
    // Add report title row
    const reportRow = worksheet.addRow(['BOOKING REPORT']);
    worksheet.mergeCells('A3:G3');
    reportRow.height = 30;
    reportRow.getCell(1).font = { 
      name: 'Arial', 
      size: 20, 
      bold: true, 
      color: { argb: 'FFFFFF' } 
    };
    reportRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF9800' }
    };
    reportRow.getCell(1).alignment = { 
      horizontal: 'center',
      vertical: 'middle' 
    };
    
    // Add spacing row
    worksheet.addRow([]);
    
    // Add generation date
    const dateRow = worksheet.addRow(['Generated:', new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })]);
    worksheet.mergeCells('B5:G5');
    dateRow.getCell(1).font = { 
      name: 'Calibri', 
      size: 11, 
      bold: true 
    };
    dateRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'ECEFF1' }
    };
    dateRow.getCell(1).alignment = { 
      horizontal: 'right',
      vertical: 'middle' 
    };
    
    dateRow.getCell(2).font = { 
      name: 'Calibri', 
      size: 11, 
      italic: true 
    };
    dateRow.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'ECEFF1' }
    };
    
    // Add filter info
    const filterRow = worksheet.addRow([
      'Filters Applied:',
      req.query.search ? `Search: "${req.query.search}"` : 'None'
    ]);
    worksheet.mergeCells('B6:G6');
    filterRow.getCell(1).font = { 
      name: 'Calibri', 
      size: 11, 
      bold: true 
    };
    filterRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'ECEFF1' }
    };
    filterRow.getCell(1).alignment = { 
      horizontal: 'right',
      vertical: 'middle' 
    };
    
    filterRow.getCell(2).font = { 
      name: 'Calibri', 
      size: 11, 
      italic: true 
    };
    filterRow.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'ECEFF1' }
    };
    
    // Add spacing row
    worksheet.addRow([]);
    
    // Add summary header
    const summaryHeaderRow = worksheet.addRow(['SUMMARY']);
    worksheet.mergeCells('A8:G8');
    summaryHeaderRow.height = 30;
    summaryHeaderRow.getCell(1).font = { 
      name: 'Calibri', 
      size: 14, 
      bold: true, 
      color: { argb: 'FFFFFF' } 
    };
    summaryHeaderRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '3F51B5' }
    };
    summaryHeaderRow.getCell(1).alignment = { 
      horizontal: 'center',
      vertical: 'middle' 
    };
    summaryHeaderRow.getCell(1).border = {
      top: { style: 'medium', color: { argb: 'B0BEC5' } },
      bottom: { style: 'medium', color: { argb: 'B0BEC5' } }
    };
    
    // Add summary data rows
    const summaryRow1 = worksheet.addRow([
      'Total Bookings:', 
      bookings.length, 
      '', 
      'Total Revenue:', 
      `$${totalRevenue.toFixed(2)}`, 
      '', 
      ''
    ]);
    
    // Style summary cells
    [1, 4].forEach(colIndex => {
      summaryRow1.getCell(colIndex).font = { 
        name: 'Calibri', 
        size: 12, 
        bold: true 
      };
      summaryRow1.getCell(colIndex).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'E8EAF6' }
      };
      summaryRow1.getCell(colIndex).alignment = { 
        horizontal: 'right',
        vertical: 'middle' 
      };
    });
    
    summaryRow1.getCell(2).font = { 
      name: 'Calibri', 
      size: 12, 
      bold: true,
      color: { argb: '303F9F' }
    };
    summaryRow1.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E8EAF6' }
    };
    
    summaryRow1.getCell(5).font = { 
      name: 'Calibri', 
      size: 14, 
      bold: true,
      color: { argb: '009688' }
    };
    summaryRow1.getCell(5).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E0F2F1' }
    };
    
    // Add status summary
    const summaryRow2 = worksheet.addRow([
      'Pending:', 
      statusCounts.pending, 
      '', 
      'Confirmed:', 
      statusCounts.confirmed, 
      '', 
      ''
    ]);
    
    const summaryRow3 = worksheet.addRow([
      'Completed:', 
      statusCounts.completed, 
      '', 
      'Cancelled:', 
      statusCounts.cancelled, 
      '', 
      ''
    ]);
    
    // Style status cells
    [summaryRow2, summaryRow3].forEach(row => {
      [1, 4].forEach(colIndex => {
        row.getCell(colIndex).font = { 
          name: 'Calibri', 
          size: 12, 
          bold: true 
        };
        row.getCell(colIndex).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'E8EAF6' }
        };
        row.getCell(colIndex).alignment = { 
          horizontal: 'right',
          vertical: 'middle' 
        };
      });
      
      [2, 5].forEach(colIndex => {
        row.getCell(colIndex).font = { 
          name: 'Calibri', 
          size: 12, 
          bold: true,
          color: { argb: '303F9F' }
        };
        row.getCell(colIndex).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'E8EAF6' }
        };
      });
    });
    
    // Add spacing row
    worksheet.addRow([]);
    
    // Add details header
    const detailsHeaderRow = worksheet.addRow(['BOOKING DETAILS']);
    worksheet.mergeCells('A13:G13');
    detailsHeaderRow.height = 30;
    detailsHeaderRow.getCell(1).font = { 
      name: 'Calibri', 
      size: 14, 
      bold: true, 
      color: { argb: 'FFFFFF' } 
    };
    detailsHeaderRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '3F51B5' }
    };
    detailsHeaderRow.getCell(1).alignment = { 
      horizontal: 'center',
      vertical: 'middle' 
    };
    detailsHeaderRow.getCell(1).border = {
      top: { style: 'medium', color: { argb: 'B0BEC5' } },
      bottom: { style: 'medium', color: { argb: 'B0BEC5' } }
    };
    
    // Add spacing row
    worksheet.addRow([]);
    
    // Add header row for data table
    const headerRow = worksheet.addRow([
      'Full Name', 
      'Email', 
      'Tour', 
      'Tour Date', 
      'Guest Count', 
      'Total Price', 
      'Status'
    ]);
    headerRow.height = 22;
    
    // Style header row
    headerRow.eachCell((cell) => {
      cell.font = { 
        name: 'Tahoma', 
        size: 12, 
        bold: true, 
        color: { argb: 'FFFFFF' } 
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '455A64' }
      };
      cell.alignment = { 
        horizontal: 'center',
        vertical: 'middle' 
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'B0BEC5' } },
        bottom: { style: 'thin', color: { argb: 'B0BEC5' } },
        left: { style: 'thin', color: { argb: 'B0BEC5' } },
        right: { style: 'thin', color: { argb: 'B0BEC5' } }
      };
    });
    
    // Add data rows
    bookings.forEach((booking, index) => {
      // Format tour date
      const tourDate = new Date(booking.tourDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      // Get tour name
      const tourName = booking.tourId ? booking.tourId.title : 'Unknown Tour';
      
      // Format status with proper capitalization
      const status = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
      
      const row = worksheet.addRow([
        booking.fullName,
        booking.email,
        tourName,
        tourDate,
        booking.guestCount,
        booking.totalPrice,
        status
      ]);
      
      row.height = 22;
      
      // Apply even/odd row styling
      const rowStyle = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: index % 2 === 0 ? 'F5F5F5' : 'FFFFFF' }
      };
      
      row.eachCell((cell, colNumber) => {
        // Base styles for all cells
        cell.fill = rowStyle;
        cell.border = {
          bottom: { style: 'hair', color: { argb: 'CFD8DC' } }
        };
        
        // Cell-specific formatting
        switch (colNumber) {
          case 1: // Full Name
            cell.font = { name: 'Calibri', size: 11, bold: true };
            cell.alignment = { horizontal: 'left' };
            break;
          case 2: // Email
            cell.font = { name: 'Calibri', size: 11, color: { argb: '1565C0' } };
            cell.alignment = { horizontal: 'left' };
            break;
          case 3: // Tour
            cell.font = { name: 'Calibri', size: 11, italic: true };
            cell.alignment = { horizontal: 'left' };
            break;
          case 4: // Tour Date
            cell.font = { name: 'Calibri', size: 11 };
            cell.alignment = { horizontal: 'center' };
            break;
          case 5: // Guest Count
            cell.font = { name: 'Calibri', size: 11 };
            cell.alignment = { horizontal: 'center' };
            break;
          case 6: // Total Price
            cell.font = { name: 'Calibri', size: 11 };
            cell.numFmt = '$#,##0.00';
            cell.alignment = { horizontal: 'right' };
            break;
          case 7: // Status
            cell.font = { 
              name: 'Tahoma', 
              size: 11, 
              bold: true,
              color: { argb: getStatusColor(booking.status) }
            };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: getStatusBgColor(booking.status) }
            };
            cell.alignment = { horizontal: 'center' };
            break;
        }
      });
    });
    
    // Add spacing rows
    worksheet.addRow([]);
    worksheet.addRow([]);
    
    // Add footer
    const copyrightRow = worksheet.addRow([`© Voyageo Tours ${new Date().getFullYear()}`]);
    worksheet.mergeCells('A' + (copyrightRow.number) + ':G' + (copyrightRow.number));
    
    const disclaimerRow = worksheet.addRow(['This report is for internal use only']);
    worksheet.mergeCells('A' + (disclaimerRow.number) + ':G' + (disclaimerRow.number));
    
    // Style footer rows
    [copyrightRow, disclaimerRow].forEach(row => {
      row.getCell(1).font = { 
        name: 'Calibri', 
        size: 10, 
        italic: true,
        color: { argb: '757575' }
      };
      row.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FAFAFA' }
      };
      row.getCell(1).alignment = { 
        horizontal: 'center',
        vertical: 'middle' 
      };
    });
    
    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=voyageo-bookings-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    // Send Excel data
    res.status(200).send(buffer);
  } catch (error) {
    console.error('Error exporting bookings to Excel:', error);
    res.status(500).send('Error generating Excel file');
  }
};

// Helper function to get status color
function getStatusColor(status) {
  switch (status) {
    case 'pending': return 'FF9800'; // Orange
    case 'confirmed': return '4CAF50'; // Green
    case 'completed': return '2196F3'; // Blue
    case 'cancelled': return 'F44336'; // Red
    default: return '757575'; // Gray
  }
}

// Helper function to get status background color
function getStatusBgColor(status) {
  switch (status) {
    case 'pending': return 'FFF3E0'; // Light orange
    case 'confirmed': return 'E8F5E9'; // Light green
    case 'completed': return 'E3F2FD'; // Light blue
    case 'cancelled': return 'FFEBEE'; // Light red
    default: return 'F5F5F5'; // Light gray
  }
}

module.exports = exports; 