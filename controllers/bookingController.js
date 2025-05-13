const UnifiedBooking = require('../models/UnifiedBooking');
const Tour = require('../models/Tour');
const Excursion = require('../models/Excursion');
const Activity = require('../models/Activity');
const Transfer = require('../models/Transfer');
const mongoose = require('mongoose');

/**
 * Create a generic booking for any type of service
 */
exports.createBooking = async (req, res) => {
  try {
    const {
      bookingType,
      itemId,
      fullName,
      email,
      phone,
      date,
      numberOfPeople,
      message,
      passengers
    } = req.body;

    // Validate required fields
    if (!bookingType || !itemId || !fullName || !email || !phone || !date || !numberOfPeople) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Get the model and find the item based on bookingType
    let itemModel, item, itemName;

    switch(bookingType) {
      case 'tour':
        itemModel = 'Tour';
        item = await Tour.findById(itemId);
        break;
      case 'excursion':
        itemModel = 'Excursion';
        item = await Excursion.findById(itemId);
        break;
      case 'activity':
        itemModel = 'Activity';
        item = await Activity.findById(itemId);
        break;
      case 'transfer':
        itemModel = 'Transfer';
        item = await Transfer.findById(itemId);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid booking type'
        });
    }

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `${bookingType.charAt(0).toUpperCase() + bookingType.slice(1)} not found`
      });
    }

    // Get item name based on type
    if (bookingType === 'tour' || bookingType === 'excursion' || bookingType === 'activity') {
      itemName = item.title;
    } else if (bookingType === 'transfer') {
      itemName = `${item.startCity} to ${item.endCity}`;
    }

    // Calculate total price
    let totalPrice;
    if (bookingType === 'transfer' && passengers) {
      // For transfers with passenger details
      const totalPassengers = (passengers.adults || 0) + (passengers.children || 0) + (passengers.infants || 0);
      totalPrice = item.price * totalPassengers;
    } else {
      // For other booking types
      totalPrice = item.price * numberOfPeople;
    }

    // Create the unified booking
    const booking = new UnifiedBooking({
      bookingType,
      fullName,
      email,
      phone,
      itemId,
      itemModel,
      itemName,
      date: new Date(date),
      numberOfPeople: parseInt(numberOfPeople),
      passengers: bookingType === 'transfer' ? passengers : undefined,
      message: message || '',
      totalPrice,
      status: 'pending',
      paymentStatus: 'unpaid'
    });

    // Save booking to database
    await booking.save();

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: {
        id: booking._id,
        bookingType: booking.bookingType,
        fullName: booking.fullName,
        email: booking.email,
        itemName: booking.itemName,
        date: booking.date,
        numberOfPeople: booking.numberOfPeople,
        totalPrice: booking.totalPrice,
        status: booking.status
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking'
    });
  }
};

/**
 * Create a tour booking
 */
exports.createTourBooking = async (req, res) => {
  try {
    // Add bookingType to request body
    req.body.bookingType = 'tour';
    
    // Call the generic booking creation function
    return await exports.createBooking(req, res);
  } catch (error) {
    console.error('Error creating tour booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tour booking'
    });
  }
};

/**
 * Create an excursion booking
 */
exports.createExcursionBooking = async (req, res) => {
  try {
    // Add bookingType to request body
    req.body.bookingType = 'excursion';
    
    // Call the generic booking creation function
    return await exports.createBooking(req, res);
  } catch (error) {
    console.error('Error creating excursion booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create excursion booking'
    });
  }
};

/**
 * Create an activity booking
 */
exports.createActivityBooking = async (req, res) => {
  try {
    // Add bookingType to request body
    req.body.bookingType = 'activity';
    
    // Map any special field names from the form
    if (req.body.activityId) {
      req.body.itemId = req.body.activityId;
    }
    
    // Call the generic booking creation function
    return await exports.createBooking(req, res);
  } catch (error) {
    console.error('Error creating activity booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create activity booking'
    });
  }
};

/**
 * Create a transfer booking
 */
exports.createTransferBooking = async (req, res) => {
  try {
    // Add bookingType to request body
    req.body.bookingType = 'transfer';
    
    // Map any special field names from the form
    if (req.body.transferId) {
      req.body.itemId = req.body.transferId;
    }
    
    // If transferDate exists, map it to date
    if (req.body.transferDate) {
      req.body.date = req.body.transferDate;
    }
    
    // Handle passenger count
    const passengerCount = req.body.passengerCount || {};
    req.body.passengers = {
      adults: passengerCount.adults || req.body.adults || 1,
      children: passengerCount.children || req.body.children || 0,
      infants: passengerCount.infants || req.body.infants || 0
    };
    
    // Set numberOfPeople as total passengers
    req.body.numberOfPeople = parseInt(req.body.passengers.adults) + 
                             parseInt(req.body.passengers.children) + 
                             parseInt(req.body.passengers.infants);
    
    // Call the generic booking creation function
    return await exports.createBooking(req, res);
  } catch (error) {
    console.error('Error creating transfer booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transfer booking'
    });
  }
}; 