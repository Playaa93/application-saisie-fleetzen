/**
 * Express Server with OpenAPI/Swagger Documentation
 *
 * Main entry point for the Form Management API
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { setupSwagger } = require('./swagger');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for Swagger UI
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('dev'));

// Setup Swagger documentation
setupSwagger(app);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Form Management API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API version prefix
app.use('/v1', (req, res, next) => {
  // Add API version info to response headers
  res.setHeader('X-API-Version', '1.0.0');
  next();
});

// Example routes (to be implemented)
app.get('/v1/forms', (req, res) => {
  res.json({
    success: true,
    message: 'This endpoint will list all forms',
    data: {
      forms: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    error: {
      code: 'NOT_FOUND',
      path: req.path,
    },
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: {
      code: err.code || 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║   Form Management API Server                          ║
║                                                       ║
║   Server: http://localhost:${PORT}                       ║
║   API Docs: http://localhost:${PORT}/api-docs            ║
║   Health: http://localhost:${PORT}/health                ║
║                                                       ║
║   Environment: ${process.env.NODE_ENV || 'development'}                            ║
╚═══════════════════════════════════════════════════════╝
    `);
  });
}

module.exports = app;
