require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

const config = require('./config');
const dbConnection = require('./database/connection');
const routes = require('./routes');
const kafkaService = require('./services/kafka.service');

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-User-ID', 'X-User-Role', 'X-User-Email', 'X-Internal-API-Key'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
}));

// Request logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Request ID middleware
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Notification Service is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/v1', routes);

// Internal API routes (for service-to-service communication)
const internalAuth = require('./middlewares/auth.middleware').internalAuth;
app.post('/internal/notifications', internalAuth, express.json(), (req, res, next) => {
  const notificationController = require('./controllers/notification.controller');
  notificationController.createInternal(req, res, next);
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);

  // Don't leak error details in production
  const isDevelopment = config.nodeEnv === 'development';

  res.status(error.status || 500).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
      ...(isDevelopment && { stack: error.stack }),
      timestamp: new Date().toISOString(),
      requestId: req.id
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
      timestamp: new Date().toISOString(),
      requestId: req.id
    }
  });
});

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`🛑 ${signal} received, shutting down gracefully...`);
  
  try {
    await kafkaService.disconnect();
    await dbConnection.disconnect();
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
async function startServer() {
  try {
    // Connect to database
    await dbConnection.connect();
    console.log('✅ Database connected');

    // Initialize Kafka (optional - service can run without it)
    await kafkaService.initConsumer();
    await kafkaService.initProducer();

    // Start HTTP server
    const server = app.listen(config.port, () => {
      console.log(`🚀 Notification Service running on port ${config.port}`);
      console.log(`📱 Health check: http://localhost:${config.port}/api/v1/health`);
      console.log(`🔔 All notification endpoints ready`);
      console.log(`📊 Mode: ${config.nodeEnv}`);
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      process.exit(1);
    });

    return server;

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };

