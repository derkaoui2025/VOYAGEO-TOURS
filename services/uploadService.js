/**
 * Upload Service
 * 
 * Provides methods for handling file uploads with support for
 * multiple storage providers (local file system or S3).
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const sharp = require('sharp');
const crypto = require('crypto');
const config = require('../config');
const mkdirp = require('mkdirp');

// S3 setup if needed
let s3, S3;
if (config.upload.provider === 's3') {
  try {
    const AWS = require('aws-sdk');
    S3 = AWS.S3;
    s3 = new S3({
      accessKeyId: config.upload.s3.accessKeyId,
      secretAccessKey: config.upload.s3.secretAccessKey,
      region: config.upload.s3.region
    });
  } catch (error) {
    console.error('Error initializing S3:', error);
  }
}

class UploadService {
  constructor() {
    this.provider = config.upload.provider;
    
    // Create upload directory for local storage if it doesn't exist
    if (this.provider === 'local') {
      const uploadDir = path.join(process.cwd(), config.upload.basePath);
      if (!fs.existsSync(uploadDir)) {
        mkdirp.sync(uploadDir);
      }
      
      // Ensure blog directory exists
      const blogDir = path.join(uploadDir, 'blog');
      if (!fs.existsSync(blogDir)) {
        mkdirp.sync(blogDir);
      }
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
   * Upload a file to the configured storage provider
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
      format = 'jpeg'
    } = options;
    
    // Check if file exists
    if (!file || !file.buffer) {
      throw new Error('No valid file provided');
    }
    
    // Check file type
    if (!file.mimetype.startsWith('image/')) {
      throw new Error('Only image files are supported');
    }
    
    // Generate unique filename
    const uniqueFilename = this.generateUniqueFilename(file.originalname);
    
    // Process image with sharp if dimensions or format are specified
    let fileBuffer = file.buffer;
    if (width || height || format) {
      try {
        const transformer = sharp(file.buffer, { failOnError: false });
        
        // Resize if width or height is specified
        if (width || height) {
          transformer.resize(width, height, {
            fit: 'inside',
            withoutEnlargement: true
          });
        }
        
        // Set format and quality
        if (format === 'jpeg') {
          transformer.jpeg({ quality });
        } else if (format === 'png') {
          transformer.png({ quality });
        } else if (format === 'webp') {
          transformer.webp({ quality });
        }
        
        fileBuffer = await transformer.toBuffer();
      } catch (error) {
        console.error('Error processing image with Sharp:', error);
        // Fall back to original buffer instead of failing
        fileBuffer = file.buffer;
      }
    }
    
    // Upload to the appropriate storage provider
    if (this.provider === 's3') {
      return this.uploadToS3(fileBuffer, uniqueFilename, folder);
    } else {
      return this.uploadToLocal(fileBuffer, uniqueFilename, folder);
    }
  }
  
  /**
   * Upload a file to S3
   * 
   * @param {Buffer} fileBuffer File buffer
   * @param {String} filename Filename
   * @param {String} folder Folder path
   * @returns {Promise<Object>} Upload result with file URL
   */
  async uploadToS3(fileBuffer, filename, folder) {
    if (!s3) {
      throw new Error('S3 is not initialized');
    }
    
    const s3Key = `${folder}/${filename}`;
    
    const params = {
      Bucket: config.upload.s3.bucket,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read'
    };
    
    const result = await s3.upload(params).promise();
    
    // Return either the CDN URL or the S3 URL
    const baseUrl = config.upload.s3.cdnUrl || result.Location;
    const fileUrl = config.upload.s3.cdnUrl ? 
      `${baseUrl}/${s3Key}` : 
      result.Location;
    
    return {
      url: fileUrl,
      filename,
      path: s3Key,
      provider: 's3'
    };
  }
  
  /**
   * Upload a file to local file system
   * 
   * @param {Buffer} fileBuffer File buffer
   * @param {String} filename Filename
   * @param {String} folder Folder path
   * @returns {Promise<Object>} Upload result with file URL
   */
  async uploadToLocal(fileBuffer, filename, folder) {
    const uploadPath = path.join(config.upload.basePath, folder);
    
    // Ensure the upload directory exists
    if (!fs.existsSync(uploadPath)) {
      await mkdirp(uploadPath);
    }
    
    const filePath = path.join(uploadPath, filename);
    const writeFile = promisify(fs.writeFile);
    
    await writeFile(filePath, fileBuffer);
    
    // Construct the URL path (relative to public directory)
    const urlPath = `/${config.upload.basePath.replace('public/', '')}/${folder}/${filename}`;
    
    return {
      url: urlPath,
      filename,
      path: filePath,
      provider: 'local'
    };
  }
  
  /**
   * Delete a file from the storage provider
   * 
   * @param {String} fileUrl URL or path of the file to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(fileUrl) {
    try {
      if (this.provider === 's3') {
        // Extract the key from the URL
        const s3Key = fileUrl.replace(`${config.upload.s3.cdnUrl}/`, '');
        
        const params = {
          Bucket: config.upload.s3.bucket,
          Key: s3Key
        };
        
        await s3.deleteObject(params).promise();
      } else {
        // For local storage, extract the path from the URL
        const localPath = path.join(
          process.cwd(), 
          'public',
          fileUrl.replace('/', '')
        );
        
        if (fs.existsSync(localPath)) {
          await promisify(fs.unlink)(localPath);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
}

module.exports = new UploadService(); 