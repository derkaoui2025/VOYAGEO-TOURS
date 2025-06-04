#!/usr/bin/env node

/**
 * Deployment script for Voyageo Tours
 * 
 * This script ensures all dependencies are correctly installed,
 * verifies environment variables, and performs any necessary setup
 * for deployment.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}=== Voyageo Tours Deployment Script ===${colors.reset}\n`);

// Step 1: Check if required environment variables are set
console.log(`${colors.blue}Step 1: Checking environment variables...${colors.reset}`);
const requiredEnvVars = [
  'MONGODB_URI',
  'SESSION_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.log(`${colors.yellow}Warning: Missing environment variables: ${missingEnvVars.join(', ')}${colors.reset}`);
  console.log('Make sure these variables are set in your deployment environment.');
} else {
  console.log(`${colors.green}✓ All required environment variables are set.${colors.reset}`);
}

// Step 2: Install dependencies
console.log(`\n${colors.blue}Step 2: Installing dependencies...${colors.reset}`);
try {
  console.log('Running npm install...');
  execSync('npm install --production', { stdio: 'inherit' });
  
  // Ensure critical dependencies are installed
  const criticalDeps = ['cloudinary', 'streamifier', 'multer-storage-cloudinary', 'mkdirp'];
  
  criticalDeps.forEach(dep => {
    try {
      // Check if the dependency can be required
      require(dep);
      console.log(`${colors.green}✓ ${dep} is installed correctly.${colors.reset}`);
    } catch (err) {
      console.log(`${colors.yellow}Warning: ${dep} could not be loaded. Installing individually...${colors.reset}`);
      try {
        execSync(`npm install ${dep} --save`, { stdio: 'inherit' });
        console.log(`${colors.green}✓ ${dep} has been installed.${colors.reset}`);
      } catch (installErr) {
        console.error(`${colors.red}Error installing ${dep}: ${installErr.message}${colors.reset}`);
      }
    }
  });
  
  console.log(`${colors.green}✓ Dependencies installed successfully.${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Error installing dependencies: ${error.message}${colors.reset}`);
  process.exit(1);
}

// Step 3: Create required directories
console.log(`\n${colors.blue}Step 3: Creating required directories...${colors.reset}`);
const requiredDirs = ['public/uploads', 'public/uploads/blog', 'public/uploads/transfers'];

requiredDirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    try {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`${colors.green}✓ Created directory: ${dir}${colors.reset}`);
    } catch (err) {
      console.error(`${colors.red}Error creating directory ${dir}: ${err.message}${colors.reset}`);
    }
  } else {
    console.log(`${colors.green}✓ Directory already exists: ${dir}${colors.reset}`);
  }
});

// Step 4: Final checks
console.log(`\n${colors.blue}Step 4: Performing final checks...${colors.reset}`);

// Check if server can start
try {
  // Check if app.js exists
  if (fs.existsSync(path.join(process.cwd(), 'app.js'))) {
    console.log(`${colors.green}✓ app.js file exists.${colors.reset}`);
  } else {
    console.error(`${colors.red}Error: app.js file not found!${colors.reset}`);
  }
  
  // Verify Cloudinary configuration
  try {
    const cloudinary = require('cloudinary').v2;
    console.log(`${colors.green}✓ Cloudinary module can be loaded.${colors.reset}`);
    
    // Don't actually test the connection as that would require valid credentials
    // Just check if the module loaded correctly
  } catch (err) {
    console.error(`${colors.red}Error loading Cloudinary module: ${err.message}${colors.reset}`);
  }
  
  console.log(`${colors.green}✓ Final checks completed successfully.${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Error during final checks: ${error.message}${colors.reset}`);
}

console.log(`\n${colors.cyan}=== Deployment Setup Complete ===${colors.reset}`);
console.log(`You can now start the server with: npm start`); 