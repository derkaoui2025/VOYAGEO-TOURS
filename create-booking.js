require('dotenv').config();
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully');

    // Import models
    const UnifiedBooking = require('./models/UnifiedBooking');
    const Tour = require('./models/Tour');

    // Find a tour to reference
    const tour = await Tour.findOne();
    
    if (!tour) {
      console.error('No tours found in database. Add a tour first.');
      process.exit(1);
    }

    // Check if the specific ID already exists
    const bookingId = '681f1263f82fdcda6a8eef73';
    
    // Convert to ObjectId (will throw an error if invalid)
    const objectId = new ObjectId(bookingId);
    
    // Check if a booking with this ID already exists
    const existingBooking = await UnifiedBooking.findById(objectId);
    
    if (existingBooking) {
      console.log('Booking with this ID already exists:', existingBooking);
      process.exit(0);
    }
    
    // Create a booking with the specific ID
    const newBooking = new UnifiedBooking({
      _id: objectId,
      bookingType: 'tour',
      fullName: 'Test Customer',
      email: 'test@example.com',
      phone: '+1234567890',
      itemId: tour._id,
      itemModel: 'Tour',
      itemName: tour.title,
      date: new Date(),
      numberOfPeople: 2,
      message: 'This is a test booking with specific ID',
      totalPrice: tour.price * 2,
      status: 'pending',
      paymentStatus: 'unpaid'
    });
    
    await newBooking.save();
    console.log('Created test booking with ID:', newBooking._id);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

run(); 