const express = require('express');
const router = express.Router();
const Tour = require('../models/Tour');
const CustomTour = require('../models/CustomTour');
const Excursion = require('../models/Excursion');
const Transfer = require('../models/Transfer');
const Activity = require('../models/Activity');
const dotenv = require('dotenv');
// const blogRoutes = require('./blog/publicRoutes')

// Import controllers
const transferController = require('../controllers/transferController');
const activityController = require('../controllers/activityPublicController');
const bookingController = require('../controllers/bookingController');

// Load environment variables
dotenv.config();

// Home page route
router.get('/', async (req, res) => {
  try {
    // Initialize arrays that will hold our data
    let featuredTours = [];
    let featuredExcursions = [];
    let featuredActivities = [];
    let popularTransfers = [];

    // First try to get featured items
    featuredTours = await Tour.find({ isFeatured: true })
      .sort('-createdAt')
      .limit(6);
    
    featuredExcursions = await Excursion.find({ isFeatured: true })
      .sort('-createdAt')
      .limit(6);
    
    featuredActivities = await Activity.find({ isFeatured: true })
      .sort('-createdAt')
      .limit(6);
      
    // Fetch featured transfers
    popularTransfers = await Transfer.find({ isFeatured: true })
      .sort('-createdAt')
      .limit(4);
    
    // If we don't have enough featured items, get regular items
    if (featuredTours.length < 3) {
      const additionalTours = await Tour.find({ hidden: false, isFeatured: { $ne: true } })
        .sort('-createdAt')
        .limit(6 - featuredTours.length);
      featuredTours = [...featuredTours, ...additionalTours];
    }
    
    if (featuredExcursions.length < 4) {
      const additionalExcursions = await Excursion.find({ isFeatured: { $ne: true } })
        .sort('-createdAt')
        .limit(6 - featuredExcursions.length);
      featuredExcursions = [...featuredExcursions, ...additionalExcursions];
    }
    
    if (featuredActivities.length < 3) {
      const additionalActivities = await Activity.find({ isFeatured: { $ne: true } })
        .sort('-createdAt')
        .limit(6 - featuredActivities.length);
      featuredActivities = [...featuredActivities, ...additionalActivities];
    }
    
    if (popularTransfers.length < 4) {
      const additionalTransfers = await Transfer.find({ isFeatured: { $ne: true } })
        .sort({ popularity: -1, createdAt: -1 })
        .limit(4 - popularTransfers.length);
      popularTransfers = [...popularTransfers, ...additionalTransfers];
    }
    
    // Log what we found to help with debugging
    console.log(`Found ${featuredTours.length} tours, ${featuredExcursions.length} excursions, ${featuredActivities.length} activities, ${popularTransfers.length} transfers`);
    
    res.render('pages/home', {
      pageTitle: 'Voyageo Tours - Discover Morocco',
      featuredTours,
      featuredExcursions,
      featuredActivities,
      popularTransfers
    });
  } catch (error) {
    console.error('Error loading home page:', error);
    res.status(500).render('pages/error', {
      pageTitle: 'Error',
      heroTitle: 'Something Went Wrong',
      heroSubtitle: 'We apologize for the inconvenience',
      message: 'Failed to load home page data'
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
      headerImagePath: '/images/headers/tours-banner.jpg', // Tours page image
      tours // Pass all tours to the template
    });
  } catch (err) {
    console.error('Error fetching tours:', err);
    res.render('pages/tours', { 
      pageTitle: 'Morocco Tours',
      heroTitle: 'Our Morocco Tours',
      heroSubtitle: 'Carefully crafted experiences for unforgettable journeys',
      headerImagePath: '/images/headers/tours-banner.jpg',
      tours: []
    });
  }
});

// Single tour details page
router.get('/tours/:destinationSlug', async (req, res) => {
  try {
    // Find tour by slug
    const tour = await Tour.findOne({ slug: req.params.destinationSlug, hidden: false })
      .select('-mainImagePublicId'); // Exclude fields not needed in UI
    
    if (!tour) {
      return res.status(404).render('pages/404', {
        pageTitle: 'Tour Not Found',
        heroTitle: 'Tour Not Found',
        heroSubtitle: 'The tour you were looking for doesn\'t exist',
        headerImagePath: '/images/headers/error-banner.jpg'
      });
    }
    
    // Use tour's first image as header if available, otherwise default to a tours banner
    const headerImagePath = tour.images && tour.images.length > 0 
      ? tour.images[0] 
      : '/images/headers/tour-details-banner.jpg';
    
    // Find related tours based on category or starting location (limit to 3)
    const relatedTours = await Tour.find({
      _id: { $ne: tour._id }, // Exclude current tour
      $or: [
        { category: tour.category },
        { startLocation: tour.startLocation }
      ],
      hidden: false
    })
    .sort({ rating: -1 })
    .limit(3)
    .select('title slug mainImage price duration startLocation');
    
    // Create meta description for SEO
    const metaDescription = tour.description.length > 160 
      ? tour.description.substring(0, 157) + '...'
      : tour.description;
      
    // Create JSON-LD structured data for rich results
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      "name": tour.title,
      "description": tour.description,
      "image": tour.mainImage,
      "offers": {
        "@type": "Offer",
        "price": tour.price,
        "priceCurrency": "MAD"
      },
      "tourOperator": {
        "@type": "Organization",
        "name": "Voyageo Tours"
      }
    };
    
    res.render('pages/destination', { 
      pageTitle: `${tour.title} | Voyageo Tours`,
      metaDescription,
      metaKeywords: `morocco tour, ${tour.category.toLowerCase()}, ${tour.startLocation.toLowerCase()}, travel`,
      structuredData: JSON.stringify(structuredData),
      heroTitle: `${tour.title}`,
      heroSubtitle: tour.description.substring(0, 120) + '...',
      headerImagePath,
      tour,
      relatedTours,
      destination: req.params.destinationSlug
    });
  } catch (err) {
    console.error('Error fetching tour details:', err);
    res.status(500).render('pages/error', {
      pageTitle: 'Error',
      heroTitle: 'Something Went Wrong',
      heroSubtitle: 'We encountered an error while loading this tour',
      headerImagePath: '/images/headers/error-banner.jpg',
      error: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
});

// Customize tour page
router.get('/customize', (req, res) => {
  res.render('pages/customize', { 
    pageTitle: 'Customize Your Tour',
    heroTitle: 'Create Your Custom Morocco Journey',
    heroSubtitle: 'Design your perfect adventure tailored to your preferences',
    headerImagePath: '/images/headers/customize-banner.jpg',
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
        headerImagePath: '/images/headers/customize-banner.jpg',
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
      headerImagePath: '/images/headers/customize-banner.jpg',
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
    heroSubtitle: 'Explore Morocco at your own pace with our reliable vehicles',
    headerImagePath: '/images/headers/car-rental-banner.jpg'
  });
});

// Contact page
router.get('/contact', (req, res) => {
  res.render('pages/contact', { 
    pageTitle: 'Contact Us',
    heroTitle: 'Get in Touch',
    heroSubtitle: 'We\'re here to help plan your perfect Morocco adventure',
    headerImagePath: '/images/headers/contact-banner.jpg'
  });
});

// FAQs page
router.get('/faqs', (req, res) => {
  res.render('pages/faqs', { 
    pageTitle: 'Traveler\'s Guide: FAQs',
    heroTitle: 'Frequently Asked Questions',
    heroSubtitle: 'Everything you need to know for your Morocco journey',
    headerImagePath: '/images/headers/faq-banner.jpg'
  });
});

// Privacy policy page
router.get('/privacy-policy', (req, res) => {
  res.render('pages/privacy-policy', { 
    pageTitle: 'Privacy Policy',
    heroTitle: 'Privacy Policy',
    heroSubtitle: 'How we protect and manage your information',
    headerImagePath: '/images/headers/legal-banner.jpg'
  });
});

// Terms of service page
router.get('/terms-of-service', (req, res) => {
  res.render('pages/terms-of-service', { 
    pageTitle: 'Terms of Service',
    heroTitle: 'Terms of Service',
    heroSubtitle: 'Our commitment to you and what we expect in return',
    headerImagePath: '/images/headers/legal-banner.jpg'
  });
});

// Unified Booking API Routes
router.post('/api/bookings', bookingController.createBooking);

// All excursions page
router.get('/excursions', async (req, res) => {
  try {
    // Get all excursions
    const excursions = await Excursion.find().sort('-createdAt');
    
    res.render('pages/excursions', { 
      pageTitle: 'Day Excursions',
      heroTitle: 'Day Excursions From Major Cities',
      heroSubtitle: 'Explore the beauty of Morocco with our guided day trips',
      headerImagePath: '/images/headers/excursions-banner.jpg',
      excursions
    });
  } catch (err) {
    console.error('Error fetching excursions:', err);
    res.render('pages/excursions', { 
      pageTitle: 'Day Excursions',
      heroTitle: 'Day Excursions From Major Cities',
      heroSubtitle: 'Explore the beauty of Morocco with our guided day trips',
      headerImagePath: '/images/headers/excursions-banner.jpg',
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
        heroSubtitle: 'The excursion you were looking for doesn\'t exist',
        headerImagePath: '/images/headers/error-banner.jpg'
      });
    }
    
    // Find related excursions from the same location
    const relatedExcursions = await Excursion.find({
      startLocation: excursion.startLocation,
      _id: { $ne: excursion._id } // exclude current excursion
    }).limit(3);
    
    // Use excursion's image as header if available, otherwise default
    const headerImagePath = excursion.image 
      ? excursion.image 
      : '/images/headers/excursion-details-banner.jpg';
    
    // Set the content type explicitly
    res.setHeader('Content-Type', 'text/html');
    
    res.render('pages/excursion-details', { 
      pageTitle: excursion.title,
      heroTitle: excursion.title,
      heroSubtitle: `${excursion.duration} ${excursion.durationType} excursion from ${excursion.startLocation}`,
      headerImagePath,
      excursion,
      relatedExcursions
    });
  } catch (err) {
    console.error('Error fetching excursion details:', err);
    res.status(404).render('pages/404', {
      pageTitle: 'Excursion Not Found',
      heroTitle: 'Excursion Not Found',
      heroSubtitle: 'The excursion you were looking for doesn\'t exist',
      headerImagePath: '/images/headers/error-banner.jpg'
    });
  }
});

// All transfers page
router.get('/transfers', transferController.renderTransfersList);

// Custom transfer request page
router.get('/transfers/custom', transferController.renderCustomTransferForm);

// Process custom transfer request
router.post('/transfers/custom', transferController.createCustomTransferRequest);

// Single transfer details page
router.get('/transfers/:slug', transferController.renderTransferDetails);

// Activities routes
router.get('/activities', activityController.getAllActivities);
router.get('/activities/:slug', activityController.getActivityBySlug);
router.post('/api/activity-bookings', activityController.bookActivity);

// Mount blog routes at /blog
// router.use('/blog', blogRoutes);

module.exports = router; 