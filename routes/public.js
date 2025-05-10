const express = require('express');
const router = express.Router();
const Tour = require('../models/Tour');
const CustomTour = require('../models/CustomTour');
const Booking = require('../models/Booking');
const Excursion = require('../models/Excursion');
const ExcursionBooking = require('../models/ExcursionBooking');
const dotenv = require('dotenv');
// const blogRoutes = require('./blog/publicRoutes')

// Load environment variables
dotenv.config();

// Home page with featured tours
router.get('/', async (req, res) => {
  try {
    // Get featured tours for the homepage
    const featuredTours = await Tour.find({ featured: true, hidden: false })
      .sort('-createdAt')
      .limit(3);
    
    res.render('pages/home', { 
      pageTitle: 'Home',
      heroTitle: 'Discover the Magic of Morocco',
      heroSubtitle: 'Experience authentic adventures with our expert local guides',
      featuredTours // Pass featured tours to the template
    });
  } catch (err) {
    console.error('Error fetching featured tours:', err);
    // Still render the page even if there's an error
    res.render('pages/home', { 
      pageTitle: 'Home',
      heroTitle: 'Discover the Magic of Morocco',
      heroSubtitle: 'Experience authentic adventures with our expert local guides',
      featuredTours: []
    });
  }
});

// All tours page
router.get('/tours', async (req, res) => {
  try {
    // Get all active tours
    const tours = await Tour.find({ hidden: false }).sort('-createdAt');
    
    res.render('pages/tours', { 
      pageTitle: 'Morocco Tours',
      heroTitle: 'Our Morocco Tours',
      heroSubtitle: 'Carefully crafted experiences for unforgettable journeys',
      tours // Pass all tours to the template
    });
  } catch (err) {
    console.error('Error fetching tours:', err);
    res.render('pages/tours', { 
      pageTitle: 'Morocco Tours',
      heroTitle: 'Our Morocco Tours',
      heroSubtitle: 'Carefully crafted experiences for unforgettable journeys',
      tours: []
    });
  }
});

// Single tour details page
router.get('/tours/:destinationSlug', async (req, res) => {
  try {
    // Find tour by slug
    const tour = await Tour.findOne({ slug: req.params.destinationSlug, hidden: false });
    
    if (!tour) {
      return res.status(404).render('pages/404', {
        pageTitle: 'Tour Not Found',
        heroTitle: 'Tour Not Found',
        heroSubtitle: 'The tour you were looking for doesn\'t exist'
      });
    }
    
    res.render('pages/destination', { 
      pageTitle: `${tour.title}`,
      heroTitle: `${tour.title}`,
      heroSubtitle: tour.description.substring(0, 120) + '...',
      tour,
      destination: req.params.destinationSlug
    });
  } catch (err) {
    console.error('Error fetching tour details:', err);
    res.status(404).render('pages/404', {
      pageTitle: 'Tour Not Found',
      heroTitle: 'Tour Not Found',
      heroSubtitle: 'The tour you were looking for doesn\'t exist'
    });
  }
});

// Customize tour page
router.get('/customize', (req, res) => {
  res.render('pages/customize', { 
    pageTitle: 'Customize Your Tour',
    heroTitle: 'Create Your Custom Morocco Journey',
    heroSubtitle: 'Design your perfect adventure tailored to your preferences',
    success: req.query.success || false,
    recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY || 'YOUR_RECAPTCHA_SITE_KEY'
  });
});

// POST route for custom tour requests
router.post('/customize', async (req, res) => {
  try {
    const { 
      fullName, 
      email, 
      phone, 
      startDate, 
      duration, 
      groupSize, 
      requestDetails,
      website, // honeypot field
      mathCaptcha,
      expectedAnswer
    } = req.body;

    // Bot detection (honeypot)
    if (website && website.trim() !== '') {
      return res.status(403).send('Forbidden');
    }

    // Verify math captcha
    if (parseInt(mathCaptcha) !== parseInt(expectedAnswer)) {
      return res.render('pages/customize', {
        pageTitle: 'Customize Your Tour',
        heroTitle: 'Create Your Custom Morocco Journey',
        heroSubtitle: 'Design your perfect adventure tailored to your preferences',
        error: 'Incorrect security answer. Please try again.',
        formData: req.body
      });
    }

    // Create new custom tour request
    const customTour = new CustomTour({
      fullName,
      email,
      phone,
      startDate,
      duration: Number(duration),
      groupSize: Number(groupSize),
      requestDetails
    });

    // Save custom tour request to database
    await customTour.save();

    // Redirect with success message
    res.redirect('/customize?success=true');
  } catch (err) {
    console.error('Error saving custom tour request:', err);
    res.render('pages/customize', {
      pageTitle: 'Customize Your Tour',
      heroTitle: 'Create Your Custom Morocco Journey',
      heroSubtitle: 'Design your perfect adventure tailored to your preferences',
      error: 'There was an error processing your request. Please try again.',
      formData: req.body
    });
  }
});

// Car rental page
router.get('/car-rental', (req, res) => {
  res.render('pages/car-rental', { 
    pageTitle: 'Rent A Car',
    heroTitle: 'Rent a Car in Morocco',
    heroSubtitle: 'Explore Morocco at your own pace with our reliable vehicles'
  });
});

// Contact page
router.get('/contact', (req, res) => {
  res.render('pages/contact', { 
    pageTitle: 'Contact Us',
    heroTitle: 'Get in Touch',
    heroSubtitle: 'We\'re here to help plan your perfect Morocco adventure'
  });
});

// FAQs page
router.get('/faqs', (req, res) => {
  res.render('pages/faqs', { 
    pageTitle: 'Traveler\'s Guide: FAQs',
    heroTitle: 'Frequently Asked Questions',
    heroSubtitle: 'Everything you need to know for your Morocco journey'
  });
});

// Privacy policy page
router.get('/privacy-policy', (req, res) => {
  res.render('pages/privacy-policy', { 
    pageTitle: 'Privacy Policy',
    heroTitle: 'Privacy Policy',
    heroSubtitle: 'How we protect and manage your information'
  });
});

// Terms of service page
router.get('/terms-of-service', (req, res) => {
  res.render('pages/terms-of-service', { 
    pageTitle: 'Terms of Service',
    heroTitle: 'Terms of Service',
    heroSubtitle: 'Our commitment to you and what we expect in return'
  });
});

// POST /api/bookings - Create a new booking
router.post('/api/bookings', async (req, res) => {
  try {
    const { fullName, email, tourId, tourDate, guestCount, specialRequests } = req.body;
    
    // Validate required fields
    if (!fullName || !email || !tourId || !tourDate || !guestCount) {
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
    
    // Find tour to calculate total price
    const tour = await Tour.findById(tourId);
    
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }
    
    // Calculate total price
    const totalPrice = tour.price * guestCount;
    
    // Create new booking
    const booking = new Booking({
      fullName,
      email,
      tourId,
      tourDate: new Date(tourDate),
      guestCount: parseInt(guestCount),
      specialRequests: specialRequests || '',
      totalPrice,
      status: 'pending'
    });
    
    // Save booking to database
    await booking.save();
    
    // Return success response
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: {
        id: booking._id,
        fullName: booking.fullName,
        email: booking.email,
        tourDate: booking.tourDate,
        guestCount: booking.guestCount,
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
});

// All excursions page
router.get('/excursions', async (req, res) => {
  try {
    // Get all excursions
    const excursions = await Excursion.find().sort('-createdAt');
    
    res.render('pages/excursions', { 
      pageTitle: 'Day Excursions',
      heroTitle: 'Day Excursions From Major Cities',
      heroSubtitle: 'Explore the beauty of Morocco with our guided day trips',
      excursions
    });
  } catch (err) {
    console.error('Error fetching excursions:', err);
    res.render('pages/excursions', { 
      pageTitle: 'Day Excursions',
      heroTitle: 'Day Excursions From Major Cities',
      heroSubtitle: 'Explore the beauty of Morocco with our guided day trips',
      excursions: []
    });
  }
});

// Single excursion details page
router.get('/excursions/:slug', async (req, res) => {
  try {
    // Find excursion by slug
    const excursion = await Excursion.findOne({ slug: req.params.slug });
    
    if (!excursion) {
      return res.status(404).render('pages/404', {
        pageTitle: 'Excursion Not Found',
        heroTitle: 'Excursion Not Found',
        heroSubtitle: 'The excursion you were looking for doesn\'t exist'
      });
    }
    
    // Find related excursions from the same location
    const relatedExcursions = await Excursion.find({
      startLocation: excursion.startLocation,
      _id: { $ne: excursion._id } // exclude current excursion
    }).limit(3);
    
    res.render('pages/excursion-details', { 
      pageTitle: excursion.title,
      heroTitle: excursion.title,
      heroSubtitle: `${excursion.duration} ${excursion.durationType} excursion from ${excursion.startLocation}`,
      excursion,
      relatedExcursions
    });
  } catch (err) {
    console.error('Error fetching excursion details:', err);
    res.status(404).render('pages/404', {
      pageTitle: 'Excursion Not Found',
      heroTitle: 'Excursion Not Found',
      heroSubtitle: 'The excursion you were looking for doesn\'t exist'
    });
  }
});

// POST /api/excursion-bookings - Create a new excursion booking
router.post('/api/excursion-bookings', async (req, res) => {
  try {
    console.log('Received excursion booking request:', req.body);
    const { fullName, email, excursionId, excursionDate, guestCount, phone } = req.body;
    
    // Validate required fields
    if (!fullName || !email || !excursionId || !excursionDate || !guestCount) {
      console.log('Missing required fields:', { fullName, email, excursionId, excursionDate, guestCount });
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
    
    // Find excursion to calculate total price (if applicable)
    console.log('Looking up excursion with ID:', excursionId);
    const excursion = await Excursion.findById(excursionId);
    
    if (!excursion) {
      console.log('Excursion not found for ID:', excursionId);
      return res.status(404).json({
        success: false,
        message: 'Excursion not found'
      });
    }
    
    console.log('Found excursion:', {
      title: excursion.title,
      type: excursion.excursionType,
      price: excursion.price
    });
    
    // Calculate total price if excursion has a price
    let totalPrice;
    if (excursion.price) {
      // For private excursions, price is per group
      // For public excursions, price is per person
      totalPrice = excursion.excursionType === 'private' 
        ? excursion.price 
        : excursion.price * guestCount;
      
      console.log('Calculated total price:', totalPrice);
    }
    
    // Create new excursion booking
    const booking = new ExcursionBooking({
      fullName,
      email,
      excursionId,
      excursionDate: new Date(excursionDate),
      guestCount: parseInt(guestCount),
      phone: phone || '',
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
      message: 'Excursion booking created successfully',
      booking: {
        id: savedBooking._id,
        fullName: savedBooking.fullName,
        email: savedBooking.email,
        excursionDate: savedBooking.excursionDate,
        guestCount: savedBooking.guestCount,
        totalPrice: savedBooking.totalPrice,
        status: savedBooking.status
      }
    });
  } catch (error) {
    console.error('Error creating excursion booking:', error);
    console.error('Request body:', req.body);
    console.error('Error details:', error.stack);
    
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
    
    // Check for MongoDB duplicate key error
    if (error.code === 11000) {
      console.error('Duplicate key error:', error.keyValue);
      return res.status(400).json({
        success: false,
        message: 'Duplicate booking error'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create excursion booking'
    });
  }
});

// Mount blog routes at /blog
// router.use('/blog', blogRoutes);

module.exports = router; 