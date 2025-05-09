# VOYAGEO-TOURS Admin Dashboard

A simple admin dashboard for the VOYAGEO-TOURS travel agency website with tour management functionality and Cloudinary integration for image optimization.

## Tech Stack

- Node.js + Express.js (Backend)
- Mongoose (Session Store via connect-mongo)
- EJS (Templating)
- Flowbite + Tailwind CSS (UI Components)
- Cloudinary (Image storage and WebP conversion)
- Multer (File uploads)

## Features

- Admin authentication using plain text credentials (as per requirements)
- Session-based authentication with MongoDB storage
- Tour management (CRUD operations)
- Image upload with automatic WebP conversion via Cloudinary
- AJAX-based image uploads with progress indicators
- Responsive UI built with Flowbite/Tailwind CSS
- Protection against login spamming with IP blocking

## Setup Instructions

1. **Clone the repository**

```bash
git clone <repository-url>
cd voyageo-tours
```

2. **Install dependencies**

```bash
npm install
```

3. **Create a `.env` file**

Create a `.env` file in the root directory with the following content:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=supersecurepassword
MONGO_URI=mongodb://localhost:27017/voyageo
SESSION_SECRET=someverysecretstring

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

4. **Set up Cloudinary**

- Sign up for a free Cloudinary account at https://cloudinary.com/
- Get your Cloud Name, API Key, and API Secret from the Dashboard
- Update the `.env` file with your Cloudinary credentials

5. **Start MongoDB**

Make sure MongoDB is running on your system.

6. **Start the server**

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

## Access the Dashboard

Open your browser and navigate to:

```
http://localhost:3000/admin/login
```

Use the credentials specified in your `.env` file to log in.

## Project Structure

```
/voyageo-tours
├── app.js                 # Main Express application
├── .env                   # Environment variables (not in repo)
├── /config
│   └── cloudinary.js      # Cloudinary configuration
├── /models
│   └── Tour.js            # Tour model schema
├── /middleware
│   ├── isAdmin.js         # Admin authentication middleware
│   ├── ipBlocker.js       # IP blocking middleware
│   └── rateLimiter.js     # Rate limiting middleware
├── /routes
│   ├── admin.js           # Admin authentication routes
│   └── tours.js           # Tour management routes
├── /public
│   ├── /js
│   │   └── admin.js       # Client-side JavaScript
│   └── /css               # CSS files (if needed)
├── /views
│   └── /admin
│       ├── login.ejs      # Admin login page
│       ├── dashboard.ejs  # Admin dashboard
│       ├── error.ejs      # Error page
│       └── /tours         # Tour management views
│           ├── index.ejs  # Tour listing
│           ├── new.ejs    # Create tour form
│           ├── edit.ejs   # Edit tour form
│           └── show.ejs   # Tour details
```

## Security Note

⚠️ This implementation uses plain text credentials as per the requirements. In a production environment, it's strongly recommended to use proper password hashing (bcrypt) and more secure authentication methods. 