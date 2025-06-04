/**
 * Upload Service
 * 
 * Provides methods for handling file uploads with support for
 * Cloudinary cloud storage.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const sharp = require('sharp');
const crypto = require('crypto');
const { cloudinary } = require('../config/cloudinary');
const config = require('../config');
const mkdirp = require('mkdirp');

class UploadService {
  constructor() {
    this.provider = 'cloudinary';
    
    // Create upload directory for local storage if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    if (!fs.existsSync(uploadDir)) {
      mkdirp.sync(uploadDir);
    }
    
    // Ensure blog directory exists
    const blogDir = path.join(uploadDir, 'blog');
    if (!fs.existsSync(blogDir)) {
      mkdirp.sync(blogDir);
    }
  }
  
  /**
   * Generate a unique filename to prevent collisions
   * 
   * @param {String} originalName Original filename
   * @returns {String} Unique filename
   */
  generateUniqueFilename(originalName) {
    const extension = path.extname(originalName);
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    return `${timestamp}-${randomString}${extension}`;
  }
  
  /**
   * Upload a file to Cloudinary
   * 
   * @param {Object} file File object from multer
   * @param {Object} options Upload options
   * @returns {Promise<Object>} Upload result with file URL
   */
  async uploadFile(file, options = {}) {
    const {
      folder = 'blog',
      width = null,
      height = null,
      quality = 80,
      format = 'webp'
    } = options;
    
    // Check if file exists
    if (!file || (!file.buffer && !file.path)) {
      throw new Error('No valid file provided');
    }
    
    // Check file type
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      throw new Error('Only image files are supported');
    }
    
    try {
      // Upload to Cloudinary directly
      const uploadParams = {
        folder: `voyageo-tours/${folder}`,
        resource_type: 'image',
        format: format,
        transformation: [
          { quality: quality }
        ]
      };
      
      // Add resize transformation if width or height is specified
      if (width || height) {
        uploadParams.transformation.push({
          width: width || null,
          height: height || null,
          crop: 'limit'
        });
      }
      
      let result;
      
      if (file.buffer) {
        // Upload from buffer using streamifier
        const streamifier = require('streamifier');
        result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            uploadParams,
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          
          streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
      } else {
        // Upload from file path
        result = await cloudinary.uploader.upload(file.path, uploadParams);
        
        // Clean up local file after upload
        try {
          await promisify(fs.unlink)(file.path);
        } catch (unlinkError) {
          console.warn('Failed to delete temporary file:', unlinkError);
        }
      }
      
      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        provider: 'cloudinary'
      };
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw new Error('Failed to upload file: ' + error.message);
    }
  }
  
  /**
   * Delete a file from Cloudinary
   * 
   * @param {String} publicId Cloudinary public ID of the file to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(publicId) {
    try {
      if (!publicId) {
        return false;
      }
      
      // If full URL is provided, extract the public ID
      if (publicId.startsWith('http')) {
        // Extract public ID from Cloudinary URL
        const urlParts = publicId.split('/');
        const filename = urlParts[urlParts.length - 1];
        const folderPath = urlParts.slice(urlParts.indexOf('upload') + 1, -1).join('/');
        publicId = `${folderPath}/${filename.split('.')[0]}`;
      }
      
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('Error deleting file from Cloudinary:', error);
      return false;
    }
  }
}

module.exports = new UploadService(); 