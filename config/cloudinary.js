const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const streamifier = require('streamifier');
const fs = require('fs');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Setup for direct upload from buffer
const bufferUpload = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'voyageo-tours',
        format: 'webp', // Automatically convert to WebP
        transformation: [
          { quality: 'auto:good' }, // Optimize quality
          { fetch_format: 'webp' } // Ensure WebP format
        ]
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// Setup for direct upload via URL
const uploadImage = async (file) => {
  try {
    // Upload the image to Cloudinary with WebP conversion
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'voyageo-tours',
      format: 'webp', // Automatically convert to WebP
      transformation: [
        { quality: 'auto:good' }, // Optimize quality
        { fetch_format: 'webp' } // Ensure WebP format
      ]
    });
    
    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Image upload failed');
  }
};

// Delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw new Error('Image deletion failed');
  }
};

// Check if running on Vercel
const isVercel = process.env.VERCEL === '1';

// Create an upload object that handles both types of files
const upload = multer({
  storage: isVercel 
    ? multer.memoryStorage() // Use memory storage on Vercel
    : multer.diskStorage({
    destination: (req, file, cb) => {
          cb(null, './uploads'); // Save to /uploads directory (only for local dev)
    },
    filename: (req, file, cb) => {
      // Create unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Middleware to process files and upload to Cloudinary
const processUploads = async (req, res, next) => {
  try {
    if (!req.files) {
      return typeof next === 'function' ? next() : null;
    }

    // Process mainImage if present
    if (req.files.mainImage && req.files.mainImage[0]) {
      try {
        const mainImageFile = req.files.mainImage[0];
        let mainImageResult;
        
        // Different upload strategy for Vercel vs local
        if (isVercel) {
          // On Vercel, upload directly from buffer
          console.log('Uploading main image directly from buffer (Vercel)');
          mainImageResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
              folder: 'voyageo-tours/main',
              format: 'webp',
              transformation: [
                { quality: 'auto:good' },
                { fetch_format: 'webp' }
              ]
            }, (error, result) => {
              if (error) {
                console.error('Error uploading main image to Cloudinary:', error);
                return reject(error);
              }
              resolve(result);
            });
            
            // Pass the buffer to the stream
            streamifier.createReadStream(mainImageFile.buffer).pipe(uploadStream);
          });
        } else {
          // On local, upload from file path
          console.log('Uploading main image from file path (local):', mainImageFile.path);
          mainImageResult = await cloudinary.uploader.upload(mainImageFile.path, {
          folder: 'voyageo-tours/main',
          format: 'webp',
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'webp' }
          ]
        });
          
          // Clean up local file (only needed for local dev)
          try {
            await unlinkAsync(mainImageFile.path);
          } catch (unlinkError) {
            console.warn('Failed to delete temporary main image file:', unlinkError);
          }
        }
        
        req.body.mainImage = mainImageResult.secure_url;
        req.body.mainImagePublicId = mainImageResult.public_id;
      } catch (uploadError) {
        console.error('Error uploading main image:', uploadError);
        throw new Error('Failed to upload main image: ' + uploadError.message);
      }
    }
    
    // Process mapImage if present
    if (req.files.mapImage && req.files.mapImage[0]) {
      try {
        const mapImageFile = req.files.mapImage[0];
        let mapImageResult;
        
        // Different upload strategy for Vercel vs local
        if (isVercel) {
          // On Vercel, upload directly from buffer
          console.log('Uploading map image directly from buffer (Vercel)');
          mapImageResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
              folder: 'voyageo-tours/maps',
              format: 'webp',
              transformation: [
                { quality: 'auto:good' },
                { fetch_format: 'webp' }
              ]
            }, (error, result) => {
              if (error) {
                console.error('Error uploading map image to Cloudinary:', error);
                return reject(error);
              }
              resolve(result);
            });
            
            // Pass the buffer to the stream
            streamifier.createReadStream(mapImageFile.buffer).pipe(uploadStream);
          });
        } else {
          // On local, upload from file path
          console.log('Uploading map image from file path (local):', mapImageFile.path);
          mapImageResult = await cloudinary.uploader.upload(mapImageFile.path, {
          folder: 'voyageo-tours/maps',
          format: 'webp',
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'webp' }
          ]
        });
          
          // Clean up local file (only needed for local dev)
          try {
            await unlinkAsync(mapImageFile.path);
          } catch (unlinkError) {
            console.warn('Failed to delete temporary map image file:', unlinkError);
          }
        }
        
        req.body.mapImage = mapImageResult.secure_url;
        req.body.mapImagePublicId = mapImageResult.public_id;
      } catch (uploadError) {
        console.error('Error uploading map image:', uploadError);
        throw new Error('Failed to upload map image: ' + uploadError.message);
      }
    }
    
    if (typeof next === 'function') {
      next();
    }
  } catch (error) {
    console.error('Error processing uploads:', error);
    if (typeof next === 'function') {
      next(error);
    } else {
      throw error;
    }
  }
};

// Configure multer storage with Cloudinary for excursion gallery images
const excursionGalleryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'voyageo-tours/excursions',
    format: async (req, file) => 'webp', // Convert all images to WebP
    public_id: (req, file) => `excursion-gallery-${Date.now()}-${Math.round(Math.random() * 1e9)}`
  }
});

// Configure multer upload for excursion gallery images
const excursionGalleryUpload = multer({
  storage: isVercel 
    ? multer.memoryStorage() 
    : excursionGalleryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Process excursion gallery uploads
const processExcursionGallery = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    // Create array to store gallery image URLs and public IDs
    const galleryImages = [];
    const galleryPublicIds = [];

    // Process each gallery image
    for (const file of req.files) {
      try {
        let result;
        
        // Different upload strategy for Vercel vs local
        if (isVercel) {
          // On Vercel, upload directly from buffer
          result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
              folder: 'voyageo-tours/excursions',
              format: 'webp',
              transformation: [
                { quality: 'auto:good' },
                { fetch_format: 'webp' }
              ]
            }, (error, result) => {
              if (error) {
                console.error('Error uploading excursion image to Cloudinary:', error);
                return reject(error);
              }
              resolve(result);
            });
            
            // Pass the buffer to the stream
            streamifier.createReadStream(file.buffer).pipe(uploadStream);
          });
        } else {
          // On local, upload from file path
          result = await cloudinary.uploader.upload(file.path, {
          folder: 'voyageo-tours/excursions',
          format: 'webp',
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'webp' }
          ]
        });
        
          // Clean up the temporary file after upload (local only)
          try {
            await unlinkAsync(file.path);
          } catch (unlinkError) {
            console.warn('Failed to delete temporary gallery image file:', unlinkError);
            // Non-fatal error, continue processing
          }
        }

        // Add image URL and public ID to arrays
        galleryImages.push(result.secure_url);
        galleryPublicIds.push(result.public_id);
      } catch (uploadError) {
        console.error('Error uploading gallery image:', uploadError);
        // Continue processing other images
      }
    }

    // Add gallery image URLs and public IDs to request body
    req.body.galleryImages = galleryImages;
    req.body.galleryPublicIds = galleryPublicIds;
    
    next();
  } catch (error) {
    console.error('Error processing excursion gallery:', error);
    next(error);
  }
};

// Configure multer storage with Cloudinary for blog images
const blogStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'voyageo-tours/blog',
    format: async (req, file) => 'webp', // Convert all images to WebP
    public_id: (req, file) => `blog-image-${Date.now()}-${Math.round(Math.random() * 1e9)}`
  }
});

// Configure multer upload for blog images
const uploadBlogImage = multer({
  storage: isVercel 
    ? multer.memoryStorage() 
    : blogStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Configure multer storage with Cloudinary for activity gallery images
const activityGalleryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'voyageo-tours/activities',
    format: async (req, file) => 'webp', // Convert all images to WebP
    public_id: (req, file) => `activity-gallery-${Date.now()}-${Math.round(Math.random() * 1e9)}`
  }
});

// Configure multer upload for activity gallery images
const activityGalleryUpload = multer({
  storage: isVercel 
    ? multer.memoryStorage() 
    : activityGalleryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Process activity gallery uploads
const processActivityGallery = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    // Create array to store gallery image URLs and public IDs
    const galleryImages = [];
    const galleryPublicIds = [];

    // Process each gallery image
    for (const file of req.files) {
      try {
        let result;
        
        // Different upload strategy for Vercel vs local
        if (isVercel) {
          // On Vercel, upload directly from buffer
          result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
              folder: 'voyageo-tours/activities',
              format: 'webp',
              transformation: [
                { quality: 'auto:good' },
                { fetch_format: 'webp' }
              ]
            }, (error, result) => {
              if (error) {
                console.error('Error uploading activity image to Cloudinary:', error);
                return reject(error);
              }
              resolve(result);
            });
            
            // Pass the buffer to the stream
            streamifier.createReadStream(file.buffer).pipe(uploadStream);
          });
        } else {
          // On local, upload from file path
          result = await cloudinary.uploader.upload(file.path, {
          folder: 'voyageo-tours/activities',
          format: 'webp',
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'webp' }
          ]
        });
        
          // Clean up the temporary file after upload (local only)
        try {
            await unlinkAsync(file.path);
          } catch (unlinkError) {
            console.warn('Failed to delete temporary activity image file:', unlinkError);
            // Non-fatal error, continue processing
        }
        }

        // Add image URL and public ID to arrays
        galleryImages.push(result.secure_url);
        galleryPublicIds.push(result.public_id);
      } catch (uploadError) {
        console.error('Error uploading activity gallery image:', uploadError);
        // Continue processing other images
      }
    }
    
    // Add gallery image URLs and public IDs to request body
    req.body.galleryImages = galleryImages;
    req.body.galleryPublicIds = galleryPublicIds;
    
    next();
  } catch (error) {
    console.error('Error processing activity gallery:', error);
    next(error);
  }
};

// Configure multer storage with Cloudinary for transfer gallery images
const transferGalleryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'voyageo-tours/transfers',
    format: async (req, file) => 'webp', // Convert all images to WebP
    public_id: (req, file) => `transfer-gallery-${Date.now()}-${Math.round(Math.random() * 1e9)}`
  }
});

// Configure multer upload for transfer gallery images
const transferGalleryUpload = multer({
  storage: isVercel 
    ? multer.memoryStorage() 
    : transferGalleryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Process transfer gallery uploads
const processTransferGallery = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    // Create array to store gallery image URLs and public IDs
    const galleryImages = [];
    const galleryPublicIds = [];

    // Process each gallery image
    for (const file of req.files) {
      try {
        let result;
        
        // Different upload strategy for Vercel vs local
        if (isVercel) {
          // On Vercel, upload directly from buffer
          result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
              folder: 'voyageo-tours/transfers',
              format: 'webp',
              transformation: [
                { quality: 'auto:good' },
                { fetch_format: 'webp' }
              ]
            }, (error, result) => {
              if (error) {
                console.error('Error uploading transfer image to Cloudinary:', error);
                return reject(error);
              }
              resolve(result);
            });
            
            // Pass the buffer to the stream
            streamifier.createReadStream(file.buffer).pipe(uploadStream);
          });
        } else {
          // On local, upload from file path
          result = await cloudinary.uploader.upload(file.path, {
            folder: 'voyageo-tours/transfers',
            format: 'webp',
            transformation: [
              { quality: 'auto:good' },
              { fetch_format: 'webp' }
            ]
          });
        
          // Clean up the temporary file after upload (local only)
          try {
            await unlinkAsync(file.path);
          } catch (unlinkError) {
            console.warn('Failed to delete temporary transfer image file:', unlinkError);
            // Non-fatal error, continue processing
          }
        }

        console.log('Successfully uploaded transfer image:', result.secure_url);

        // Add image URL and public ID to arrays
        galleryImages.push(result.secure_url);
        galleryPublicIds.push(result.public_id);
      } catch (uploadError) {
        console.error('Error uploading transfer gallery image:', uploadError);
        // Continue processing other images
      }
    }
    
    // Add gallery image URLs and public IDs to request body
    req.body.gallery = galleryImages;
    req.body.galleryPublicIds = galleryPublicIds;
    
    next();
  } catch (error) {
    console.error('Error processing transfer gallery:', error);
    next(error);
  }
};

module.exports = {
  cloudinary,
  upload,
  processUploads,
  uploadImage,
  deleteImage,
  bufferUpload,
  excursionGalleryUpload,
  processExcursionGallery,
  uploadBlogImage,
  activityGalleryUpload,
  processActivityGallery,
  transferGalleryUpload,
  processTransferGallery
}; 