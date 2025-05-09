const mongoose = require('mongoose');
const ipfilter = require('express-ipfilter').IpFilter;

// Create a schema for blocked IPs
const blockedIPSchema = new mongoose.Schema({
  ip: { type: String, required: true, unique: true },
  reason: { type: String, default: 'Login form spamming' },
  createdAt: { type: Date, default: Date.now }
});

// Create the model
const BlockedIP = mongoose.model('BlockedIP', blockedIPSchema);

// Function to block an IP
async function blockIP(ip, reason = 'Login form spamming') {
  try {
    await BlockedIP.findOneAndUpdate(
      { ip },
      { ip, reason },
      { upsert: true, new: true }
    );
    console.log(`IP ${ip} has been blocked for ${reason}`);
    return true;
  } catch (error) {
    console.error('Error blocking IP:', error);
    return false;
  }
}

// Middleware to check if an IP is blocked
async function getBlockedIPs() {
  try {
    const blockedIPs = await BlockedIP.find({}).select('ip -_id');
    return blockedIPs.map(item => item.ip);
  } catch (error) {
    console.error('Error fetching blocked IPs:', error);
    return [];
  }
}

// Create middleware function
async function ipBlockerMiddleware(req, res, next) {
  try {
    const blockedIPs = await getBlockedIPs();
    const ipFilterMiddleware = ipfilter(blockedIPs, { mode: 'deny', logLevel: 'deny' });
    
    return ipFilterMiddleware(req, res, (err) => {
      if (err) {
        return res.status(403).send('Access Denied: Your IP has been blocked.');
      }
      next();
    });
  } catch (error) {
    console.error('Error in IP blocker middleware:', error);
    next();
  }
}

module.exports = {
  ipBlockerMiddleware,
  blockIP,
  BlockedIP
}; 