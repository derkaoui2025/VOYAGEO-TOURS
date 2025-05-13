const Activity = require('../../models/Activity');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);
const { cloudinary } = require('../../config/cloudinary');

// Get all activities
exports.getAllActivities = async (req, res) => {
  try {
    const activities = await Activity.find().sort('-createdAt');
    
    res.render('admin/activities/index', {
      pageTitle: 'Activities',
      activePage: 'activities',
      activities,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.render('admin/activities/index', {
      pageTitle: 'Activities',
      activePage: 'activities',
      activities: [],
      error: 'Failed to load activities'
    });
  }
};

// Show form to create a new activity
exports.showCreateForm = (req, res) => {
  res.render('admin/activities/create', {
    pageTitle: 'Create Activity',
    activePage: 'activities',
    error: null
  });
};

// Process the create activity form
exports.createActivity = async (req, res) => {
  try {
    const { title, description, includes, notIncludes, location, duration, durationType, price } = req.body;
    
    // Create new activity
    const activity = new Activity({
      title,
      description,
      includes,
      notIncludes,
      location,
      duration,
      durationType: durationType || 'hours',
      price
    });
    
    // Handle image uploads from Cloudinary
    if (req.body.gallery && req.body.gallery.length > 0) {
      activity.gallery = req.body.gallery;
      activity.galleryPublicIds = req.body.galleryPublicIds;
    }
    
    // Save activity
    await activity.save();
    
    // Return JSON response for AJAX request
    return res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      activity,
      redirect: '/admin/activities?success=Activity created successfully'
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    
    // Return JSON error for AJAX request
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create activity'
    });
  }
};

// Show form to edit an activity
exports.showEditForm = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.redirect('/admin/activities?error=Activity not found');
    }
    
    res.render('admin/activities/edit', {
      pageTitle: 'Edit Activity',
      activePage: 'activities',
      activity,
      error: null
    });
  } catch (error) {
    console.error('Error fetching activity for edit:', error);
    res.redirect('/admin/activities?error=Failed to load activity');
  }
};

// Process the edit activity form
exports.updateActivity = async (req, res) => {
  try {
    console.log("Updating activity with ID:", req.params.id);
    console.log("Request body:", req.body);
    
    const { title, description, includes, notIncludes, location, duration, durationType, price } = req.body;
    
    // Find activity
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    // Update fields
    activity.title = title;
    activity.description = description;
    activity.includes = includes;
    activity.notIncludes = notIncludes;
    activity.location = location;
    activity.duration = duration;
    activity.durationType = durationType || 'hours';
    activity.price = price;
    
    // Handle image uploads from Cloudinary
    if (req.body.gallery && req.body.gallery.length > 0) {
      // Make sure we're dealing with clean arrays before adding new images
      const existingGallery = Array.isArray(activity.gallery) ? activity.gallery : [];
      const existingGalleryPublicIds = Array.isArray(activity.galleryPublicIds) ? activity.galleryPublicIds : [];
      
      // Add new images to the gallery
      activity.gallery = [...existingGallery, ...req.body.gallery];
      activity.galleryPublicIds = [...existingGalleryPublicIds, ...(req.body.galleryPublicIds || [])];
    }
    
    // Save updated activity
    await activity.save();
    
    // Return JSON response for AJAX request
    return res.status(200).json({
      success: true,
      message: 'Activity updated successfully',
      activity,
      redirect: '/admin/activities?success=Activity updated successfully'
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    
    // Return JSON error for AJAX request
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to update activity'
    });
  }
};

// Delete activity
exports.deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    // Delete images from Cloudinary
    if (activity.galleryPublicIds && activity.galleryPublicIds.length > 0) {
      for (const publicId of activity.galleryPublicIds) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error('Error deleting image from Cloudinary:', err);
        }
      }
    }
    
    // Delete activity from database
    await Activity.findByIdAndDelete(req.params.id);
    
    return res.status(200).json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting activity:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete activity'
    });
  }
};

// Delete an image from activity gallery
exports.deleteImage = async (req, res) => {
  try {
    const { id, imageIndex } = req.params;
    
    const activity = await Activity.findById(id);
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    if (imageIndex >= activity.gallery.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image index'
      });
    }
    
    // Get public ID from array at the same index if available
    if (activity.galleryPublicIds && activity.galleryPublicIds[imageIndex]) {
      const publicId = activity.galleryPublicIds[imageIndex];
      
      // Delete from Cloudinary
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error('Error deleting image from Cloudinary:', err);
        // Continue with deletion from database even if Cloudinary deletion fails
      }
      
      // Remove from galleryPublicIds array
      activity.galleryPublicIds.splice(imageIndex, 1);
    }
    
    // Remove from gallery array
    activity.gallery.splice(imageIndex, 1);
    
    // Save activity
    await activity.save();
    
    return res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete image'
    });
  }
}; 