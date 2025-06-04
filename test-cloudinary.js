#!/usr/bin/env node

/**
 * Cloudinary Test Script
 * 
 * This script tests Cloudinary configuration and uploads
 * to ensure images will work properly in production.
 */

require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const streamifier = require('streamifier');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}=== Cloudinary Configuration Test ===${colors.reset}\n`);

// Check for environment variables
console.log(`${colors.blue}Checking Cloudinary environment variables...${colors.reset}`);

const requiredVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`${colors.red}Error: Missing environment variables: ${missingVars.join(', ')}${colors.reset}`);
  console.log(`Make sure these variables are defined in your .env file or environment.`);
  process.exit(1);
}

console.log(`${colors.green}✓ All Cloudinary environment variables are set.${colors.reset}`);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log(`${colors.blue}\nTesting Cloudinary configuration...${colors.reset}`);

async function testCloudinaryConnection() {
  try {
    // Test if we can ping Cloudinary
    const result = await cloudinary.api.ping();
    console.log(`${colors.green}✓ Successfully connected to Cloudinary!${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Failed to connect to Cloudinary: ${error.message}${colors.reset}`);
    console.log('Please check your credentials and internet connection.');
    return false;
  }
}

async function testImageUpload() {
  console.log(`${colors.blue}\nTesting image upload...${colors.reset}`);
  
  // Path to test image (either use an existing image or create a test one)
  let testImagePath = path.join(__dirname, 'public/images/transfers/default-transfer.jpg');
  
  if (!fs.existsSync(testImagePath)) {
    // Try to find another image
    const alternativePaths = [
      path.join(__dirname, 'public/images/headers/transfer-details-banner.jpg'),
      path.join(__dirname, 'public/images/logo-voyageo-white.webp')
    ];
    
    for (const altPath of alternativePaths) {
      if (fs.existsSync(altPath)) {
        testImagePath = altPath;
        console.log(`Using alternative test image: ${path.basename(altPath)}`);
        break;
      }
    }
  }
  
  if (!fs.existsSync(testImagePath)) {
    console.error(`${colors.red}✗ No test image found. Creating a sample image...${colors.reset}`);
    
    // Create a directory if needed
    const testDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Create a simple test image file with text
    testImagePath = path.join(testDir, 'test-image.txt');
    fs.writeFileSync(testImagePath, 'This is a test file for Cloudinary uploads.');
    console.log(`Created test file at: ${testImagePath}`);
  }
  
  try {
    // Test upload from file path
    console.log(`Uploading test image from path: ${testImagePath}`);
    const uploadResult = await cloudinary.uploader.upload(testImagePath, {
      folder: 'voyageo-tours/test',
      public_id: `test-${Date.now()}`,
      overwrite: true
    });
    
    console.log(`${colors.green}✓ Successfully uploaded image to Cloudinary!${colors.reset}`);
    console.log(`Image URL: ${uploadResult.secure_url}`);
    
    // Test buffer upload (like the one used in production)
    console.log(`\n${colors.blue}Testing buffer upload (simulating production environment)...${colors.reset}`);
    
    const fileBuffer = fs.readFileSync(testImagePath);
    
    const bufferUploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'voyageo-tours/test',
          public_id: `test-buffer-${Date.now()}`,
          overwrite: true
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      
      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
    
    console.log(`${colors.green}✓ Successfully uploaded image buffer to Cloudinary!${colors.reset}`);
    console.log(`Buffer Upload URL: ${bufferUploadResult.secure_url}`);
    
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Failed to upload image: ${error.message}${colors.reset}`);
    if (error.http_code) {
      console.log(`HTTP Status: ${error.http_code}`);
    }
    console.log(`Please check your credentials, upload limits, and account status.`);
    return false;
  }
}

async function main() {
  const connectionSuccessful = await testCloudinaryConnection();
  
  if (connectionSuccessful) {
    await testImageUpload();
  }
  
  console.log(`\n${colors.cyan}=== Test Complete ===${colors.reset}`);
}

main().catch(error => {
  console.error(`${colors.red}Unhandled error: ${error.message}${colors.reset}`);
  process.exit(1);
}); 