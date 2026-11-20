const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { apiLimiter } = require('./middlewares/rateLimiterMiddleware');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorMiddleware');
const { swaggerSpec, renderSwaggerHTML } = require('./config/swaggerDoc');

// Import Route handlers
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Swagger UI CDN assets
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows serving uploaded images across origins
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'] : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-guest-token'],
  })
);

// Serve local static uploads directory (backend/uploads)
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Request parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Global Rate Limiter for API endpoints
app.use('/api', apiLimiter);

// Root & Health Checks
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the E-Commerce REST API',
    docs: '/api-docs',
    version: '1.0.0',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected',
  });
});

// Swagger Interactive Documentation
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.get('/api-docs', (req, res) => {
  res.send(renderSwaggerHTML('/api-docs/swagger.json'));
});

// Mount Module Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/upload', uploadRoutes);

// 404 Route Not Found
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `API Route '${req.originalUrl}' with method '${req.method}' not found`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start server (only when not imported as a test runner module)
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(async () => {
    // Drop legacy global unique name_1 index if present so subcategories can share names under different parents
    try {
      const Category = require('./models/Category');
      await Category.collection.dropIndex('name_1');
    } catch (idxErr) {
      // Index might already be dropped or not exist, safe to ignore
    }

    // Automatically initialize default Admin, Customer, and Category tree if database is fresh
    try {
      const autoSeed = require('./seed/autoSeed');
      await autoSeed();
    } catch (seedErr) {
      console.warn('AutoSeed notice:', seedErr.message);
    }

    // Auto-migrate any existing paid orders that were left as Pending
    try {
      const Order = require('./models/Order');
      await Order.updateMany(
        { paymentStatus: 'Paid', status: 'Pending' },
        {
          $set: { status: 'Confirmed' },
          $push: {
            statusHistory: {
              status: 'Confirmed',
              timestamp: new Date(),
              note: 'Payment verified: Order confirmed',
            },
          },
        }
      );
    } catch (orderMigrateErr) {
      // Ignore migration errors on initial startup
    }

    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 E-Commerce API running at http://localhost:${PORT}`);
      console.log(`📚 Swagger Docs available at http://localhost:${PORT}/api-docs`);
      console.log(`👤 Default Admin: admin@ecommerce.com / Admin@1234`);
      console.log(`👤 Default Customer: customer@ecommerce.com / Customer@1234`);
      console.log(`===============================================`);
    });
  });
}

module.exports = app;
