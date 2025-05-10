const Excursion = require('../../models/Excursion');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);
const { cloudinary } = require('../../config/cloudinary');

// Get all excursions
exports.getAllExcursions = async (req, res) => {
  try {
    const excursions = await Excursion.find().sort('-createdAt');
    
    res.render('admin/excursions/index', {
      pageTitle: 'Excursions',
      activePage: 'excursions',
      excursions,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Error fetching excursions:', error);
    res.render('admin/excursions/index', {
      pageTitle: 'Excursions',
      activePage: 'excursions',
      excursions: [],
      error: 'Failed to load excursions'
    });
  }
};

// Show form to create a new excursion
exports.showCreateForm = (req, res) => {
  res.render('admin/excursions/create', {
    pageTitle: 'Create Excursion',
    activePage: 'excursions',
    error: null
  });
};

// Process the create excursion form
exports.createExcursion = async (req, res) => {
  try {
    const { title, description, startLocation, duration, durationType, excursionType } = req.body;
    
    // Create new excursion
    const excursion = new Excursion({
      title,
      description,
      startLocation,
      duration,
      durationType: durationType || 'hours',
      excursionType
    });
    
    // Handle image uploads from Cloudinary
    if (req.body.gallery && req.body.gallery.length > 0) {
      excursion.gallery = req.body.gallery;
      excursion.galleryPublicIds = req.body.galleryPublicIds;
    }
    
    // Save excursion
    await excursion.save();
    
    // Return JSON response for AJAX request
    return res.status(201).json({
      success: true,
      message: 'Excursion created successfully',
      excursion,
      redirect: '/admin/excursions?success=Excursion created successfully'
    });
  } catch (error) {
    console.error('Error creating excursion:', error);
    
    // Return JSON error for AJAX request
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create excursion'
    });
  }
};

// Show form to edit an excursion
exports.showEditForm = async (req, res) => {
  try {
    const excursion = await Excursion.findById(req.params.id);
    
    if (!excursion) {
      return res.redirect('/admin/excursions?error=Excursion not found');
    }
    
    res.render('admin/excursions/edit', {
      pageTitle: 'Edit Excursion',
      activePage: 'excursions',
      excursion,
      error: null
    });
  } catch (error) {
    console.error('Error fetching excursion for edit:', error);
    res.redirect('/admin/excursions?error=Failed to load excursion');
  }
};

// Process the edit excursion form
exports.updateExcursion = async (req, res) => {
  try {
    const { title, description, startLocation, duration, durationType, excursionType } = req.body;
    
    // Find excursion
    const excursion = await Excursion.findById(req.params.id);
    
    if (!excursion) {
      return res.status(404).json({
        success: false,
        message: 'Excursion not found'
      });
    }
    
    // Update fields
    excursion.title = title;
    excursion.description = description;
    excursion.startLocation = startLocation;
    excursion.duration = duration;
    excursion.durationType = durationType || 'hours';
    excursion.excursionType = excursionType;
    
    // Handle image uploads from Cloudinary
    if (req.body.gallery && req.body.gallery.length > 0) {
      // Add new images to the gallery
      excursion.gallery = [...excursion.gallery, ...req.body.gallery];
      excursion.galleryPublicIds = [...(excursion.galleryPublicIds || []), ...req.body.galleryPublicIds];
    }
    
    // Save updated excursion
    await excursion.save();
    
    // Return JSON response for AJAX request
    return res.status(200).json({
      success: true,
      message: 'Excursion updated successfully',
      excursion,
      redirect: '/admin/excursions?success=Excursion updated successfully'
    });
  } catch (error) {
    console.error('Error updating excursion:', error);
    
    // Return JSON error for AJAX request
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to update excursion'
    });
  }
};

// Delete excursion
exports.deleteExcursion = async (req, res) => {
  try {
    const excursion = await Excursion.findById(req.params.id);
    
    if (!excursion) {
      return res.status(404).json({
        success: false,
        message: 'Excursion not found'
      });
    }
    
    // Delete images from Cloudinary
    if (excursion.galleryPublicIds && excursion.galleryPublicIds.length > 0) {
      for (const publicId of excursion.galleryPublicIds) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error('Error deleting image from Cloudinary:', err);
        }
      }
    }
    
    // Delete excursion from database
    await Excursion.findByIdAndDelete(req.params.id);
    
    return res.status(200).json({
      success: true,
      message: 'Excursion deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting excursion:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete excursion'
    });
  }
};

// Delete an image from excursion gallery
exports.deleteImage = async (req, res) => {
  try {
    const { id, imageIndex } = req.params;
    
    const excursion = await Excursion.findById(id);
    
    if (!excursion) {
      return res.status(404).json({
        success: false,
        message: 'Excursion not found'
      });
    }
    
    if (imageIndex >= excursion.gallery.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image index'
      });
    }
    
    // Get public ID from array at the same index if available
    if (excursion.galleryPublicIds && excursion.galleryPublicIds[imageIndex]) {
      const publicId = excursion.galleryPublicIds[imageIndex];
      
      // Delete from Cloudinary
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error('Error deleting image from Cloudinary:', err);
      }
      
      // Remove from galleryPublicIds array
      excursion.galleryPublicIds.splice(imageIndex, 1);
    }
    
    // Remove from gallery array
    excursion.gallery.splice(imageIndex, 1);
    
    // Save excursion
    await excursion.save();
    
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