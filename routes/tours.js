const express = require('express');
const router = express.Router();
const Tour = require('../models/Tour');
const isAdmin = require('../middleware/isAdmin');
const { deleteImage } = require('../utils/cloudinary'); 
const { upload, processUploads } = require('../config/cloudinary');
const Booking = require('../models/Booking');

// GET: List all tours
router.get('/', isAdmin, async (req, res) => {
  try {
    const tours = await Tour.find().sort('-createdAt');
    res.render('admin/tours/index', {
      pageTitle: 'Tours Management',
      activePage: 'tours',
      tours,
      success: req.query.success
    });
  } catch (error) {
    console.error('Error fetching tours:', error);
    res.render('admin/tours/index', {
      pageTitle: 'Tours Management',
      activePage: 'tours',
      tours: [],
      error: 'Failed to load tours'
    });
  }
});

// GET: New tour form
router.get('/new', isAdmin, (req, res) => {
  res.render('admin/tours/new', {
    pageTitle: 'Create New Tour',
    activePage: 'tours'
  });
});

// POST: Create a new tour
router.post('/', isAdmin, upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'mapImage', maxCount: 1 }
]), processUploads, async (req, res) => {
  try {
    // Extract tour data from request body
    const {
      title, description, price, duration, startLocation,
      groupSize, accommodation, category, includes, excludes,
      featured, hidden
    } = req.body;
    
    // Validate required fields
    const errors = {};
    if (!title) errors.title = 'Title is required';
    if (!description) errors.description = 'Description is required';
    if (!price || isNaN(price)) errors.price = 'Valid price is required';
    if (!duration || isNaN(duration)) errors.duration = 'Valid duration is required';
    if (!startLocation) errors.startLocation = 'Starting location is required';
    if (!groupSize || isNaN(groupSize)) errors.groupSize = 'Valid group size is required';
    if (!accommodation) errors.accommodation = 'Accommodation details are required';
    if (!category) errors.category = 'Category is required';
    
    // Check if images were uploaded via Cloudinary middleware
    const { mainImage, mainImagePublicId, mapImage, mapImagePublicId } = req.body;
    
    if (!mainImage) {
      errors.mainImage = 'Main image is required';
    }
    
    if (!mapImage) {
      errors.mapImage = 'Map image is required';
    }
    
    // If there are validation errors, return them
    if (Object.keys(errors).length > 0) {
      console.log('Validation errors:', errors);
      return res.status(400).json({ 
        success: false, 
        message: 'Please fix the validation errors',
        errors 
      });
    }
    
    // Process includes and excludes
    const includesArray = includes ? includes.split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0) : [];
    
    const excludesArray = excludes ? excludes.split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0) : [];
    
    // Process itinerary (if provided)
    const itineraryData = [];
    if (req.body.itinerary) {
      // If itinerary comes as array (multiple days)
      if (Array.isArray(req.body.itinerary)) {
        req.body.itinerary.forEach(day => {
          if (day.title && day.description) {
            const highlights = day.highlights 
              ? day.highlights.split('\n').map(h => h.trim()).filter(h => h.length > 0)
              : [];
              
            itineraryData.push({
              day: parseInt(day.day),
              title: day.title,
              description: day.description,
              distance: day.distance || '',
              highlights
            });
          }
        });
      }
      // Sort itinerary by day number
      itineraryData.sort((a, b) => a.day - b.day);
    }
    
    // Create new tour
    const newTour = new Tour({
      title,
      description,
      price: parseFloat(price),
      duration: parseInt(duration),
      startLocation,
      groupSize: parseInt(groupSize),
      accommodation,
      category,
      includes: includesArray,
      excludes: excludesArray,
      itinerary: itineraryData,
      featured: !!featured,
      hidden: !!hidden,
      mainImage,
      mainImagePublicId,
      mapImage,
      mapImagePublicId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Save the tour
    await newTour.save();
    
    // Return success response for AJAX
    return res.status(201).json({
      success: true,
      message: 'Tour created successfully!',
      tourId: newTour._id,
      redirect: `/admin/tours/${newTour._id}`
    });
  } catch (error) {
    console.error('Error creating tour:', error);
    
    // Return error response for AJAX
    return res.status(500).json({
      success: false,
      message: 'An error occurred while creating the tour: ' + error.message
    });
  }
});

// GET: Edit tour form
router.get('/:id/edit', isAdmin, async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    
    if (!tour) {
      return res.status(404).render('admin/error', {
        message: 'Tour not found'
      });
    }
    
    res.render('admin/tours/edit', {
      pageTitle: `Edit ${tour.title}`,
      activePage: 'tours',
      tour
    });
  } catch (error) {
    console.error('Error fetching tour:', error);
    return res.status(500).render('admin/error', {
      message: 'Failed to load tour details'
    });
  }
});

// GET: View tour details
router.get('/:id', isAdmin, async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    
    if (!tour) {
      return res.status(404).render('admin/error', {
        message: 'Tour not found'
      });
    }
    
    res.render('admin/tours/show', {
      pageTitle: tour.title,
      activePage: 'tours',
      tour,
      success: req.query.success
    });
  } catch (error) {
    console.error('Error fetching tour:', error);
    return res.status(500).render('admin/error', {
      message: 'Failed to load tour details'
    });
  }
});

// POST: Delete a tour
router.post('/:id/delete', isAdmin, async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    
    if (!tour) {
      return res.status(404).render('admin/error', { 
        message: 'Tour not found'
      });
    }
    
    // Delete images from Cloudinary
    if (tour.mainImagePublicId) {
      await deleteImage(tour.mainImagePublicId);
    }
    
    if (tour.mapImagePublicId) {
      await deleteImage(tour.mapImagePublicId);
    }
    
    // Delete the tour from the database
    await tour.deleteOne();
    
    // Redirect back to the tours list with success message
    return res.redirect('/admin/tours?success=Tour deleted successfully');
  } catch (error) {
    console.error('Error deleting tour:', error);
    return res.status(500).render('admin/error', { 
      message: 'Failed to delete tour'
    });
  }
});

// POST: Toggle featured status
router.post('/:id/toggle-featured', isAdmin, async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    
    if (!tour) {
      return res.status(404).render('admin/error', { 
        message: 'Tour not found'
      });
    }
    
    // Toggle the featured status
    tour.featured = !tour.featured;
    
    // Save the changes
    await tour.save();
    
    // Redirect back to the tour detail page
    return res.redirect(`/admin/tours/${tour._id}?success=Featured status updated`);
  } catch (error) {
    console.error('Error toggling featured status:', error);
    return res.status(500).render('admin/error', { 
      message: 'Failed to update featured status'
    });
  }
});

// POST: Toggle visibility status
router.post('/:id/toggle-visibility', isAdmin, async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    
    if (!tour) {
      return res.status(404).render('admin/error', { 
        message: 'Tour not found'
      });
    }
    
    // Toggle the hidden status
    tour.hidden = !tour.hidden;
    
    // Save the changes
    await tour.save();
    
    // Redirect back to the tour detail page
    return res.redirect(`/admin/tours/${tour._id}?success=Visibility status updated`);
  } catch (error) {
    console.error('Error toggling visibility:', error);
    return res.status(500).render('admin/error', { 
      message: 'Failed to update visibility'
    });
  }
});

// POST: Update a tour
router.post('/:id/update', isAdmin, upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'mapImage', maxCount: 1 }
]), processUploads, async (req, res) => {
  try {
    console.log('Update request body:', req.body);
    const tourId = req.params.id;
    const tour = await Tour.findById(tourId);
    
    if (!tour) {
      return res.status(404).render('admin/error', {
        message: 'Tour not found'
      });
    }
    
    // Extract tour data from request body
    const {
      title, description, price, duration, startLocation,
      groupSize, accommodation, category, includes, excludes,
      featured, hidden, mainImage, mainImagePublicId, mapImage, mapImagePublicId
    } = req.body;
    
    // Basic validation
    const errors = {};
    if (!title) errors.title = 'Title is required';
    if (!description) errors.description = 'Description is required';
    if (!price || isNaN(price)) errors.price = 'Valid price is required';
    if (!duration || isNaN(duration)) errors.duration = 'Valid duration is required';
    if (!startLocation) errors.startLocation = 'Starting location is required';
    if (!groupSize || isNaN(groupSize)) errors.groupSize = 'Valid group size is required';
    if (!accommodation) errors.accommodation = 'Accommodation details are required';
    if (!category) errors.category = 'Category is required';
    
    // If there are validation errors, return them
    if (Object.keys(errors).length > 0) {
      console.log('Validation errors:', errors);
      
      // For traditional form submission, re-render the edit page with errors
      return res.render('admin/tours/edit', {
        pageTitle: `Edit ${tour.title}`,
        activePage: 'tours',
        tour,
        error: 'Please fix the validation errors below',
        errors
      });
    }
    
    // Update tour basic info
    tour.title = title;
    tour.description = description;
    tour.price = parseFloat(price);
    tour.duration = parseInt(duration);
    tour.startLocation = startLocation;
    tour.groupSize = parseInt(groupSize);
    tour.accommodation = accommodation;
    tour.category = category;
    tour.featured = !!featured;
    tour.hidden = !!hidden;
    
    // Process includes and excludes (convert from string to array)
    if (includes) {
      tour.includes = includes.split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }
    
    if (excludes) {
      tour.excludes = excludes.split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }
    
    // Process itinerary (if provided)
    if (req.body.itinerary) {
      const itineraryData = [];
      
      // If itinerary comes as array (multiple days)
      if (Array.isArray(req.body.itinerary)) {
        req.body.itinerary.forEach(day => {
          if (day.title && day.description) {
            const highlights = day.highlights 
              ? day.highlights.split('\n').map(h => h.trim()).filter(h => h.length > 0)
              : [];
              
            itineraryData.push({
              day: parseInt(day.day),
              title: day.title,
              description: day.description,
              distance: day.distance || '',
              highlights
            });
          }
        });
      }
      // Sort itinerary by day number
      itineraryData.sort((a, b) => a.day - b.day);
      tour.itinerary = itineraryData;
    }
    
    // Update images if provided by Cloudinary processUploads middleware
    if (mainImage) {
      tour.mainImage = mainImage;
    }
    
    if (mainImagePublicId) {
      tour.mainImagePublicId = mainImagePublicId;
    }
    
    if (mapImage) {
      tour.mapImage = mapImage;
    }
    
    if (mapImagePublicId) {
      tour.mapImagePublicId = mapImagePublicId;
    }
    
    // For a new tour, ensure images are provided
    if (!tour.mainImage) {
      errors.mainImage = 'Main image is required';
    }
    
    if (!tour.mapImage) {
      errors.mapImage = 'Map image is required';
    }
    
    // If there are validation errors, return them
    if (Object.keys(errors).length > 0) {
      console.log('Image validation errors:', errors);
      
      // For traditional form submission, re-render the edit page with errors
      return res.render('admin/tours/edit', {
        pageTitle: `Edit ${tour.title}`,
        activePage: 'tours',
        tour,
        error: 'Please fix the validation errors below',
        errors
      });
    }
    
    // Update timestamp
    tour.updatedAt = new Date();
    
    // Save the updated tour
    await tour.save();
    
    // Redirect to the tour detail page with success message
    return res.redirect(`/admin/tours/${tourId}?success=Tour updated successfully`);
  } catch (error) {
    console.error('Error updating tour:', error);
    
    // Render error page for traditional form submission
    return res.status(500).render('admin/error', {
      message: 'An error occurred while updating the tour: ' + error.message
    });
  }
});

// Export the router
module.exports = router; 