/**
 * Frontend Transfer Controller
 * 
 * Handles all public-facing transfer operations
 */

const Transfer = require('../models/Transfer');
const TransferBooking = require('../models/TransferBooking');

/**
 * Render the transfers list page
 */
exports.renderTransfersList = async (req, res) => {
  try {
    // Get all transfers
    const transfers = await Transfer.find().sort('-createdAt');
    
    res.render('pages/transfers', { 
      pageTitle: 'City Transfers',
      heroTitle: 'Morocco City Transfers',
      heroSubtitle: 'Reliable and comfortable transportation between cities in Morocco',
      headerImagePath: '/images/headers/transfers-banner.jpg',
      transfers
    });
  } catch (err) {
    console.error('Error fetching transfers:', err);
    res.render('pages/transfers', { 
      pageTitle: 'City Transfers',
      heroTitle: 'Morocco City Transfers',
      heroSubtitle: 'Reliable and comfortable transportation between cities in Morocco',
      headerImagePath: '/images/headers/transfers-banner.jpg',
      transfers: []
    });
  }
};

/**
 * Render single transfer details page
 */
exports.renderTransferDetails = async (req, res) => {
  try {
    // Find transfer by slug
    const transfer = await Transfer.findOne({ slug: req.params.slug });
    
    if (!transfer) {
      return res.status(404).render('pages/404', {
        pageTitle: 'Transfer Not Found',
        heroTitle: 'Transfer Not Found',
        heroSubtitle: 'The transfer you were looking for doesn\'t exist',
        headerImagePath: '/images/headers/error-banner.jpg'
      });
    }
    
    // Find related transfers (same start city or end city)
    const relatedTransfers = await Transfer.find({
      $or: [
        { startCity: transfer.startCity, _id: { $ne: transfer._id } },
        { endCity: transfer.endCity, _id: { $ne: transfer._id } }
      ]
    }).limit(3);
    
    // Use transfer's image if available, otherwise default
    const headerImagePath = transfer.image 
      ? transfer.image 
      : '/images/headers/transfer-details-banner.jpg';
    
    res.render('pages/transfer-details', { 
      pageTitle: `${transfer.startCity} to ${transfer.endCity} Transfer`,
      heroTitle: `${transfer.startCity} to ${transfer.endCity} Transfer and More`,
      heroSubtitle: `${transfer.duration} private transfer with professional driver`,
      headerImagePath,
      transfer,
      relatedTransfers
    });
  } catch (err) {
    console.error('Error fetching transfer details:', err);
    res.status(404).render('pages/404', {
      pageTitle: 'Transfer Not Found',
      heroTitle: 'Transfer Not Found',
      heroSubtitle: 'The transfer you were looking for doesn\'t exist',
      headerImagePath: '/images/headers/error-banner.jpg'
    });
  }
};

/**
 * Process transfer booking request
 */
exports.createTransferBooking = async (req, res) => {
  try {
    console.log('Received transfer booking request:', req.body);
    const { 
      fullName, 
      email, 
      transferId, 
      transferDate, 
      adults, 
      children, 
      infants, 
      language, 
      phone, 
      specialRequests 
    } = req.body;
    
    // Validate required fields
    if (!fullName || !email || !transferId || !transferDate || !adults) {
      console.log('Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    // Find transfer to calculate total price
    console.log('Looking up transfer with ID:', transferId);
    const transfer = await Transfer.findById(transferId);
    
    if (!transfer) {
      console.log('Transfer not found for ID:', transferId);
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }
    
    // Calculate total price based on number of passengers
    // (could implement more complex pricing logic if needed)
    const totalPassengers = parseInt(adults) + parseInt(children || 0) + parseInt(infants || 0);
    const totalPrice = transfer.price;
    
    // Create new transfer booking
    const booking = new TransferBooking({
      fullName,
      email,
      transferId,
      transferDate: new Date(transferDate),
      passengerCount: {
        adults: parseInt(adults),
        children: parseInt(children || 0),
        infants: parseInt(infants || 0)
      },
      language: language || 'English',
      phone: phone || '',
      specialRequests: specialRequests || '',
      totalPrice,
      status: 'pending'
    });
    
    console.log('Created booking object:', booking);
    
    // Save booking to database
    const savedBooking = await booking.save();
    console.log('Booking saved successfully with ID:', savedBooking._id);
    
    // Return success response
    res.status(201).json({
      success: true,
      message: 'Transfer booking created successfully',
      booking: {
        id: savedBooking._id,
        fullName: savedBooking.fullName,
        email: savedBooking.email,
        transferDate: savedBooking.transferDate,
        passengerCount: savedBooking.passengerCount,
        totalPrice: savedBooking.totalPrice,
        status: savedBooking.status
      }
    });
  } catch (error) {
    console.error('Error creating transfer booking:', error);
    
    // Check for MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      console.error('Validation errors:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create transfer booking'
    });
  }
};

/**
 * Render custom transfer request form
 */
exports.renderCustomTransferForm = (req, res) => {
  res.render('pages/custom-transfer', { 
    pageTitle: 'Custom Transfer Request',
    heroTitle: 'Request a Custom Transfer',
    heroSubtitle: 'Design your perfect transfer between any cities in Morocco',
    headerImagePath: '/images/headers/custom-transfer-banner.jpg',
    success: req.query.success || false
  });
};

/**
 * Process custom transfer request
 */
exports.createCustomTransferRequest = async (req, res) => {
  try {
    const { 
      fullName, 
      email, 
      phone,
      startCity,
      endCity, 
      departureDate,
      departureTime,
      passengerCount,
      additionalInfo
    } = req.body;

    // Create custom transfer request in database
    const CustomTransferRequest = require('../models/CustomTransferRequest');
    await CustomTransferRequest.create({
      fullName,
      email,
      phone,
      startCity,
      endCity,
      departureDate,
      departureTime,
      passengerCount: parseInt(passengerCount, 10),
      additionalInfo,
      status: 'pending'
    });
    
    // Redirect with success message
    res.redirect('/transfers/custom?success=true');
  } catch (err) {
    console.error('Error saving custom transfer request:', err);
    res.render('pages/custom-transfer', {
      pageTitle: 'Custom Transfer Request',
      heroTitle: 'Request a Custom Transfer',
      heroSubtitle: 'Design your perfect transfer between any cities in Morocco',
      error: 'There was an error processing your request. Please try again.',
      formData: req.body
    });
  }
}; 