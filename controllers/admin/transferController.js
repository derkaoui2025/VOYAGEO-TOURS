const Transfer = require('../../models/Transfer');
const { cloudinary } = require('../../config/cloudinary');

// Get all transfers
exports.getAllTransfers = async (req, res) => {
  try {
    const transfers = await Transfer.find().sort('-createdAt');
    
    res.render('admin/transfers/index', {
      pageTitle: 'Transfers',
      activePage: 'transfers',
      transfers,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('Error fetching transfers:', error);
    res.render('admin/transfers/index', {
      pageTitle: 'Transfers',
      activePage: 'transfers',
      transfers: [],
      error: 'Failed to load transfers'
    });
  }
};

// Show form to create a new transfer
exports.showCreateForm = (req, res) => {
  res.render('admin/transfers/create', {
    pageTitle: 'Create Transfer',
    activePage: 'transfers',
    error: null
  });
};

// Process the create transfer form
exports.createTransfer = async (req, res) => {
  try {
    const { 
      startCity, 
      endCity, 
      price, 
      duration, 
      maxPassengers, 
      vehicleType, 
      description, 
      departureTime, 
      included, 
      excluded 
    } = req.body;
    
    // Create new transfer
    const transfer = new Transfer({
      startCity,
      endCity,
      price,
      duration,
      maxPassengers,
      vehicleType,
      description,
      departureTime,
      included: included ? (Array.isArray(included) ? included : [included]) : [],
      excluded: excluded ? (Array.isArray(excluded) ? excluded : [excluded]) : []
    });
    
    // Handle image uploads from Cloudinary
    if (req.body.gallery && req.body.gallery.length > 0) {
      transfer.gallery = req.body.gallery;
      transfer.galleryPublicIds = req.body.galleryPublicIds;
    }
    
    // Save transfer
    await transfer.save();
    
    // Return JSON response for AJAX request
    return res.status(201).json({
      success: true,
      message: 'Transfer created successfully',
      transfer,
      redirect: '/admin/transfers?success=Transfer created successfully'
    });
  } catch (error) {
    console.error('Error creating transfer:', error);
    
    // Return JSON error for AJAX request
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create transfer'
    });
  }
};

// Show form to edit a transfer
exports.showEditForm = async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    
    if (!transfer) {
      return res.redirect('/admin/transfers?error=Transfer not found');
    }
    
    res.render('admin/transfers/edit', {
      pageTitle: 'Edit Transfer',
      activePage: 'transfers',
      transfer,
      error: null
    });
  } catch (error) {
    console.error('Error fetching transfer for edit:', error);
    res.redirect('/admin/transfers?error=Failed to load transfer');
  }
};

// Process the edit transfer form
exports.updateTransfer = async (req, res) => {
  try {
    const { 
      startCity, 
      endCity, 
      price, 
      duration, 
      maxPassengers, 
      vehicleType, 
      description, 
      departureTime, 
      included, 
      excluded,
      existingGallery,
      existingGalleryPublicIds
    } = req.body;
    
    // Find transfer
    const transfer = await Transfer.findById(req.params.id);
    
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }
    
    // Update fields
    transfer.startCity = startCity;
    transfer.endCity = endCity;
    transfer.price = price;
    transfer.duration = duration;
    transfer.maxPassengers = maxPassengers;
    transfer.vehicleType = vehicleType;
    transfer.description = description;
    transfer.departureTime = departureTime;
    transfer.included = included ? (Array.isArray(included) ? included : [included]) : [];
    transfer.excluded = excluded ? (Array.isArray(excluded) ? excluded : [excluded]) : [];
    
    // Handle existing gallery images
    if (existingGallery) {
      try {
        const parsedExistingGallery = typeof existingGallery === 'string' 
          ? JSON.parse(existingGallery) 
          : existingGallery;
          
        const parsedExistingPublicIds = existingGalleryPublicIds 
          ? (typeof existingGalleryPublicIds === 'string' 
            ? JSON.parse(existingGalleryPublicIds) 
            : existingGalleryPublicIds) 
          : [];
        
        // Find images that were removed
        const removedImages = transfer.gallery.filter(img => !parsedExistingGallery.includes(img));
        const removedPublicIds = [];
        
        // Find the public IDs of removed images
        if (removedImages.length > 0 && transfer.galleryPublicIds) {
          removedImages.forEach(removedImg => {
            const index = transfer.gallery.indexOf(removedImg);
            if (index !== -1 && index < transfer.galleryPublicIds.length) {
              removedPublicIds.push(transfer.galleryPublicIds[index]);
            }
          });
        }
        
        // Delete removed images from Cloudinary
        if (removedPublicIds.length > 0) {
          for (const publicId of removedPublicIds) {
            try {
              await cloudinary.uploader.destroy(publicId);
              console.log(`Deleted image with public ID: ${publicId}`);
            } catch (err) {
              console.error(`Error deleting image from Cloudinary: ${err.message}`);
            }
          }
        }
        
        // Update gallery arrays to only keep remaining images
        transfer.gallery = parsedExistingGallery;
        transfer.galleryPublicIds = parsedExistingPublicIds;
      } catch (err) {
        console.error('Error processing existing gallery:', err);
      }
    }
    
    // Handle new image uploads from Cloudinary (if processed by middleware)
    if (req.body.gallery && req.body.gallery.length > 0) {
      // Ensure we have valid arrays
      const newGallery = Array.isArray(req.body.gallery) ? req.body.gallery : [req.body.gallery];
      const newPublicIds = req.body.galleryPublicIds 
        ? (Array.isArray(req.body.galleryPublicIds) ? req.body.galleryPublicIds : [req.body.galleryPublicIds])
        : [];
      
      // Add new images to the gallery
      transfer.gallery = [...transfer.gallery, ...newGallery];
      transfer.galleryPublicIds = [...transfer.galleryPublicIds, ...newPublicIds];
    }
    
    // Save updated transfer
    await transfer.save();
    
    // Return JSON response for AJAX request
    return res.status(200).json({
      success: true,
      message: 'Transfer updated successfully',
      transfer,
      redirect: '/admin/transfers?success=Transfer updated successfully'
    });
  } catch (error) {
    console.error('Error updating transfer:', error);
    
    // Return JSON error for AJAX request
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to update transfer'
    });
  }
};

// Delete transfer
exports.deleteTransfer = async (req, res) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }
    
    // Delete images from Cloudinary
    if (transfer.galleryPublicIds && transfer.galleryPublicIds.length > 0) {
      for (const publicId of transfer.galleryPublicIds) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error('Error deleting image from Cloudinary:', err);
        }
      }
    }
    
    // Delete transfer from database
    await Transfer.findByIdAndDelete(req.params.id);
    
    return res.status(200).json({
      success: true,
      message: 'Transfer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting transfer:', error);
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete transfer'
    });
  }
};

// Delete an image from transfer gallery
exports.deleteImage = async (req, res) => {
  try {
    const { id, imageIndex } = req.params;
    
    const transfer = await Transfer.findById(id);
    
    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found'
      });
    }
    
    if (!transfer.gallery || !transfer.gallery[imageIndex]) {
      return res.status(400).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    // Get the public ID to delete from Cloudinary
    const publicId = transfer.galleryPublicIds[imageIndex];
    
    // Remove the image and public ID from the arrays
    transfer.gallery.splice(imageIndex, 1);
    transfer.galleryPublicIds.splice(imageIndex, 1);
    
    // Save the updated transfer
    await transfer.save();
    
    // Delete the image from Cloudinary
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error('Error deleting image from Cloudinary:', err);
      }
    }
    
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