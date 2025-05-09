/**
 * Production Environment Configuration
 * 
 * Settings optimized for production deployment.
 */

module.exports = {
  app: {
    host: process.env.HOST || '0.0.0.0', // Listen on all network interfaces
  },
  db: {
    // Production database should have proper authentication
    options: {
      // Increase pool size for production
      poolSize: 10,
      // Add reconnect settings
      reconnectTries: Number.MAX_VALUE,
      reconnectInterval: 1000,
      // Additional production settings
      socketTimeoutMS: 30000,
      keepAlive: true,
      keepAliveInitialDelay: 300000
    }
  },
  session: {
    // Use more secure settings for session in production
    cookie: {
      secure: true, // Only send cookies over HTTPS
      httpOnly: true, // Prevent client-side JS from reading the cookie
      sameSite: 'strict' // CSRF protection
    },
    // Session store configuration (can be configured to use Redis or MongoDB)
    store: {
      // If using Redis store:
      // type: 'redis',
      // url: process.env.REDIS_URL
    }
  },
  // Enable caching in production
  cache: {
    enabled: true,
    ttl: 3600, // 1 hour in seconds
    provider: process.env.CACHE_PROVIDER || 'memory', // 'memory', 'redis'
    redisUrl: process.env.REDIS_URL
  },
  // Upload settings for production (e.g. using S3)
  upload: {
    provider: process.env.UPLOAD_PROVIDER || 's3',
    s3: {
      bucket: process.env.S3_BUCKET,
      region: process.env.S3_REGION || 'us-east-1',
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY,
      // Optional CDN URL for serving assets
      cdnUrl: process.env.CDN_URL
    }
  },
  // Security settings for production
  security: {
    // Rate limiting to prevent abuse
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    },
    // Content Security Policy
    csp: {
      enabled: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://www.google.com", "https://www.gstatic.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://maps.googleapis.com", "https://*.amazonaws.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'"]
      }
    },
    // CORS settings
    cors: {
      enabled: true,
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }
  },
  // Logging settings for production
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json', // Structured logging for production
    // Log file settings if using file logging
    file: {
      enabled: true,
      filename: 'logs/app.log',
      maxSize: '10m',
      maxFiles: 5
    }
  },
  // Blog specific settings for production
  blog: {
    // Enable caching for blog posts in production
    cachePosts: true,
    cacheTTL: 3600 // 1 hour
  }
}; 