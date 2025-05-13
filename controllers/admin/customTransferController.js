const CustomTransferRequest = require('../../models/CustomTransferRequest');

/**
 * Get all custom transfer requests
 */
exports.getAllCustomTransfers = async (req, res) => {
  try {
    const customTransfers = await CustomTransferRequest.find().sort('-createdAt');
    
    res.render('admin/custom-transfers/index', {
      pageTitle: 'Custom Transfer Requests',
      activePage: 'custom-transfers',
      customTransfers,
      success: req.query.success,
      error: null
    });
  } catch (error) {
    console.error('Error fetching custom transfer requests:', error);
    res.render('admin/custom-transfers/index', {
      pageTitle: 'Custom Transfer Requests',
      activePage: 'custom-transfers',
      customTransfers: [],
      error: 'Failed to load custom transfer requests'
    });
  }
};

/**
 * Show single custom transfer request
 */
exports.getCustomTransferDetails = async (req, res) => {
  try {
    const customTransfer = await CustomTransferRequest.findById(req.params.id);
    
    if (!customTransfer) {
      return res.status(404).render('admin/error', {
        message: 'Custom transfer request not found'
      });
    }
    
    res.render('admin/custom-transfers/show', {
      pageTitle: 'Custom Transfer Request Details',
      activePage: 'custom-transfers',
      customTransfer,
      success: req.query.success
    });
  } catch (error) {
    console.error('Error fetching custom transfer request:', error);
    return res.status(500).render('admin/error', {
      message: 'Failed to load custom transfer request details'
    });
  }
};

/**
 * Update custom transfer request status
 */
exports.updateCustomTransferStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'reviewed', 'confirmed', 'completed', 'rejected'].includes(status)) {
      return res.status(400).render('admin/error', {
        message: 'Invalid status'
      });
    }
    
    const customTransfer = await CustomTransferRequest.findById(req.params.id);
    
    if (!customTransfer) {
      return res.status(404).render('admin/error', {
        message: 'Custom transfer request not found'
      });
    }
    
    customTransfer.status = status;
    await customTransfer.save();
    
    return res.redirect(`/admin/custom-transfers/${customTransfer._id}?success=Status updated successfully`);
  } catch (error) {
    console.error('Error updating custom transfer status:', error);
    return res.status(500).render('admin/error', {
      message: 'Failed to update custom transfer status'
    });
  }
};

/**
 * Delete custom transfer request
 */
exports.deleteCustomTransfer = async (req, res) => {
  try {
    const customTransfer = await CustomTransferRequest.findById(req.params.id);
    
    if (!customTransfer) {
      return res.status(404).render('admin/error', {
        message: 'Custom transfer request not found'
      });
    }
    
    await customTransfer.deleteOne();
    
    return res.redirect('/admin/custom-transfers?success=Custom transfer request deleted successfully');
  } catch (error) {
    console.error('Error deleting custom transfer request:', error);
    return res.status(500).render('admin/error', {
      message: 'Failed to delete custom transfer request'
    });
  }
}; 