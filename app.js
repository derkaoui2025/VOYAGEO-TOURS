const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const dotenv = require('dotenv');
const methodOverride = require('method-override');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Trust proxy for correctly identifying client IPs behind a proxy
app.set('trust proxy', true);

// Set up EJS as the view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Import middlewares
// const { ipBlockerMiddleware } = require('./middleware/ipBlocker');
// const { generalRateLimiter } = require('./middleware/rateLimiter');

// Apply global middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
// app.use(ipBlockerMiddleware);
// app.use(generalRateLimiter);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Make session available to all views
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Create a simple public directory for static files (JS, CSS)
app.use(express.static(path.join(__dirname, 'public')));

// Import routes
const adminRoutes = require('./routes/admin');
const adminTourRoutes = require('./routes/tours');
const publicRoutes = require('./routes/public');

// Apply routes
app.use('/admin', adminRoutes);
app.use('/admin/tours', adminTourRoutes);
app.use('/', publicRoutes);

// Redirect root /admin to /admin/dashboard or /admin/login if not authenticated
app.get('/admin', (req, res) => {
  if (req.session && req.session.isAdmin) {
    res.redirect('/admin/dashboard');
  } else {
    res.redirect('/admin/login');
  }
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).render('pages/404', {
    pageTitle: '404 - Page Not Found',
    heroTitle: 'Page Not Found',
    heroSubtitle: 'The page you were looking for doesn\'t exist',
    headerImagePath: '/images/headers/error-banner.jpg'
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start the server with port fallback
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    
    // Handle port already in use error
    server.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is already in use, trying port ${PORT + 1}`);
        const alternatePort = PORT + 1;
        app.listen(alternatePort, () => {
          console.log(`Server running on alternate port ${alternatePort}`);
        });
      } else {
        console.error('Server error:', e);
      }
    });
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  }); 