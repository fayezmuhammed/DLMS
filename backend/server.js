const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');
const dueBooksJob = require('./jobs/checkDueBooks');
const compression = require('compression');
const helmet = require('helmet');

// Load env vars
dotenv.config();

// Connect to database
const startServer = async () => {
  try {
    await connectDB();
    console.log('MongoDB connected...');
    
    // Schedule the due books check
    dueBooksJob.schedule('0 9 * * *');
    console.log('Due books check scheduled to run daily at 9:00 AM');
    
    const app = express();

    // Apply performance optimizations
    
    // Security headers
    app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    }));
    
    // Compress all responses
    app.use(compression());
    
    // CORS setup
    app.use(cors({
      origin: ['http://localhost:5173', 'http://localhost:5174','https://dlms-backend-gz41.onrender.com'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      exposedHeaders: ['Set-Cookie']
    }));
    
    // JSON parsing middleware - increased limits for e-books
    app.use(express.json({ limit: '10mb' }));
    
    // Static file serving with improved caching
    const cacheControl = {
      setHeaders: (res, filePath) => {
        const mimeTypes = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.pdf': 'application/pdf'
        };
        const ext = path.extname(filePath).toLowerCase();
        if (mimeTypes[ext]) res.setHeader('Content-Type', mimeTypes[ext]);
        
        // Long cache for static assets (1 day)
        res.setHeader('Cache-Control', 'public, max-age=86400');
      }
    };
    
    app.use('/uploads', express.static(path.join(__dirname, 'uploads'), cacheControl));
    app.use(express.static(path.join(__dirname, 'public'), cacheControl));
    
    // Mount all routes
    const routes = {
      '/api/auth': require('./routes/authRoutes'),
      '/api/books': require('./routes/bookRoutes'),
      '/api/ebooks': require('./routes/ebooks'),
      '/api/transactions': require('./routes/transactionRoutes'),
      '/api/categories': require('./routes/categoryRoutes'),
      '/api/users': require('./routes/userRoutes'),
      '/api/reports': require('./routes/reportRoutes'),
      '/api/admin': require('./routes/adminRoutes'),
      '/api/settings': require('./routes/settingsRoutes'),
      '/api/wishlist': require('./routes/wishlistRoutes'),
      '/api/reservations': require('./routes/reservationRoutes')
    };
    
    Object.entries(routes).forEach(([path, router]) => app.use(path, router));
    
    // Optimized error handling
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ success: false, message: 'Something went wrong!' });
    });
    
    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

startServer(); 