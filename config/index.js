/**
 * Configuration Manager
 * 
 * This module loads environment-specific configurations and provides
 * a centralized way to access configuration settings throughout the application.
 */

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Determine which environment to use
const environment = process.env.NODE_ENV || 'development';

// Default configuration (common across all environments)
const defaultConfig = {
  app: {
    name: 'Voyageo Tours',
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
  },
  db: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/voyageo',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },
  session: {
    secret: process.env.SESSION_SECRET || 'voyageo-tours-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: environment === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  },
  upload: {
    provider: process.env.UPLOAD_PROVIDER || 'local', // 'local' or 's3'
    basePath: process.env.UPLOAD_BASE_PATH || 'public/uploads',
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
  },
  blog: {
    postsPerPage: 10,
    featuredPostsLimit: 3,
    recentPostsLimit: 5,
    popularCategoriesLimit: 10,
  },
  recaptcha: {
    siteKey: process.env.RECAPTCHA_SITE_KEY,
    secretKey: process.env.RECAPTCHA_SECRET_KEY,
  }
};

// Load environment-specific configuration
let environmentConfig = {};
try {
  environmentConfig = require(`./environment/${environment}`);
  console.log(`Loaded ${environment} configuration`);
} catch (error) {
  console.warn(`No specific configuration found for ${environment}, using defaults`);
}

// Merge configurations (environment-specific overrides defaults)
const config = {
  ...defaultConfig,
  ...environmentConfig,
  // Ensure nested objects are properly merged
  db: { ...defaultConfig.db, ...environmentConfig.db },
  session: { ...defaultConfig.session, ...environmentConfig.session },
  upload: { ...defaultConfig.upload, ...environmentConfig.upload },
  blog: { ...defaultConfig.blog, ...environmentConfig.blog },
};

// Add environment property
config.environment = environment;
config.isDevelopment = environment === 'development';
config.isProduction = environment === 'production';
config.isTest = environment === 'test';

module.exports = config; 