const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const streamifier = require('streamifier');

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

// Configure multer storage with Cloudinary for main images
const mainImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'voyageo-tours/main',
    format: async (req, file) => 'webp', // Convert all images to WebP
    public_id: (req, file) => `tour-main-${Date.now()}-${Math.round(Math.random() * 1e9)}`
  }
});

// Configure multer storage with Cloudinary for map images
const mapImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'voyageo-tours/maps',
    format: async (req, file) => 'webp', // Convert all images to WebP
    public_id: (req, file) => `tour-map-${Date.now()}-${Math.round(Math.random() * 1e9)}`
  }
});

// Configure multer upload
const mainUpload = multer({
  storage: mainImageStorage,
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

// Configure multer upload for map images
const mapUpload = multer({
  storage: mapImageStorage,
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

// Create an upload object that handles both types of files
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './uploads'); // Save to /uploads directory
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
        // Upload from path
        const mainImageResult = await cloudinary.uploader.upload(mainImageFile.path, {
          folder: 'voyageo-tours/main',
          format: 'webp',
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'webp' }
          ]
        });
        
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
        // Upload from path
        const mapImageResult = await cloudinary.uploader.upload(mapImageFile.path, {
          folder: 'voyageo-tours/maps',
          format: 'webp',
          transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'webp' }
          ]
        });
        
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

module.exports = {
  cloudinary,
  upload,
  mainUpload,
  mapUpload,
  processUploads,
  uploadImage,
  bufferUpload,
  deleteImage
}; 