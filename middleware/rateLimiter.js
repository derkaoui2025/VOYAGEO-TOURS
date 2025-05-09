const rateLimit = require('express-rate-limit');
const { blockIP } = require('./ipBlocker');

// Track login attempts to identify potential spammers
const loginAttempts = new Map();

// Create rate limiter for login attempts
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: async (req, res, _, options) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    
    // Track this IP's failed attempts
    const attempts = loginAttempts.get(ip) || 0;
    loginAttempts.set(ip, attempts + 1);
    
    // If too many attempts (10+), permanently block this IP
    if (attempts >= 10) {
      await blockIP(ip, 'Excessive login attempts');
      return res.status(403).send('Your IP has been permanently blocked due to excessive login attempts.');
    }
    
    // Otherwise just send the standard rate limit message
    res.status(options.statusCode).send(options.message);
  }
});

// Create general rate limiter for all routes
const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  loginRateLimiter,
  generalRateLimiter
}; 