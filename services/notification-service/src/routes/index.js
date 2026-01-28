const express = require('express');
const router = express.Router();

const notificationRoutes = require('./notification.routes');
const preferencesRoutes = require('./preferences.routes');

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const dbConnection = require('../database/connection');
    const healthCheck = await dbConnection.healthCheck();
    
    res.status(200).json({
      success: true,
      message: 'Notification service is healthy',
      data: {
        service: 'notification-service',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        database: healthCheck,
        uptime: process.uptime()
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNHEALTHY',
        message: 'Service health check failed',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// API routes
router.use('/notifications', notificationRoutes);
router.use('/notifications/preferences', preferencesRoutes);

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ENDPOINT_NOT_FOUND',
      message: `Endpoint ${req.method} ${req.originalUrl} not found`,
      timestamp: new Date().toISOString(),
      requestId: req.id
    }
  });
});

module.exports = router;

