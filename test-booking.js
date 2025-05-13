require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

// Connect to MongoDB
async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Import the UnifiedBooking model
    const UnifiedBooking = require('./models/UnifiedBooking');
    
    // Count bookings
    const count = await UnifiedBooking.countDocuments();
    console.log(`Total bookings in database: ${count}`);
    
    // List all bookings (limited to 10)
    const bookings = await UnifiedBooking.find().limit(10);
    console.log('Recent bookings:');
    bookings.forEach(booking => {
      console.log(`- ID: ${booking._id}, Type: ${booking.bookingType}, Name: ${booking.fullName}, Status: ${booking.status}`);
    });
    
    // Check for specific booking ID
    const bookingId = '681f1263f82fdcda6a8eef73';
    
    if (mongoose.Types.ObjectId.isValid(bookingId)) {
      console.log(`Checking for booking with ID: ${bookingId}`);
      const booking = await UnifiedBooking.findById(bookingId);
      
      if (booking) {
        console.log('Booking found:');
        console.log(booking);
      } else {
        console.log('Booking not found. It might have been deleted or the ID is incorrect.');
      }
    } else {
      console.log(`Invalid booking ID format: ${bookingId}`);
    }
    
    // Create a test booking if there are none
    if (count === 0) {
      console.log('No bookings found. Creating a test booking...');
      
      // First, import models for related entities
      const Tour = require('./models/Tour');
      
      // Find a tour to reference
      const tour = await Tour.findOne();
      
      if (tour) {
        const testBooking = new UnifiedBooking({
          bookingType: 'tour',
          fullName: 'Test Customer',
          email: 'test@example.com',
          phone: '+1234567890',
          itemId: tour._id,
          itemModel: 'Tour', 
          itemName: tour.title,
          date: new Date(),
          numberOfPeople: 2,
          message: 'This is a test booking',
          totalPrice: tour.price * 2,
          status: 'pending',
          paymentStatus: 'unpaid'
        });
        
        await testBooking.save();
        console.log('Test booking created with ID:', testBooking._id);
        console.log('Created booking details:', testBooking);
      } else {
        console.log('No tours found to reference in the test booking.');
      }
    }
    
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

run(); 