const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Blog image storage configuration
const blogStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'voyageo-tours/blog',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1200, crop: 'limit' }, // Limit width to 1200px
      { quality: 'auto:good' } // Automatic quality optimization
    ],
    format: 'webp', // Convert all images to WebP for better performance
    public_id: (req, file) => {
      // Generate a unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const filename = file.originalname.split('.')[0];
      return `${filename}-${uniqueSuffix}`;
    }
  }
});

// Category image storage configuration
const categoryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'voyageo-tours/categories',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 800, height: 450, crop: 'fill' }, // Fixed aspect ratio
      { quality: 'auto:good' }
    ],
    format: 'webp',
    public_id: (req, file) => {
      const filename = file.originalname.split('.')[0];
      return `category-${filename}`;
    }
  }
});

// Avatar image storage configuration
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'voyageo-tours/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' }, // Square with face detection
      { quality: 'auto:good' }
    ],
    format: 'webp',
    public_id: (req, file) => {
      const username = req.user ? req.user.username : 'guest';
      return `avatar-${username}-${Date.now()}`;
    }
  }
});

// Create multer upload instances
const uploadBlogImage = multer({ storage: blogStorage });
const uploadCategoryImage = multer({ storage: categoryStorage });
const uploadAvatarImage = multer({ storage: avatarStorage });

// Helper function to delete an image from cloudinary
const deleteImage = async (public_id) => {
  if (!public_id) return { result: 'No public_id provided' };
  
  try {
    const result = await cloudinary.uploader.destroy(public_id);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

// Helper function to optimize an existing image
const optimizeImage = async (public_id) => {
  try {
    const result = await cloudinary.uploader.explicit(public_id, {
      type: 'upload',
      eager: [
        { width: 1200, crop: 'limit', quality: 'auto:good', format: 'webp' }
      ]
    });
    return result;
  } catch (error) {
    console.error('Error optimizing image:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadBlogImage,
  uploadCategoryImage,
  uploadAvatarImage,
  deleteImage,
  optimizeImage
}; 