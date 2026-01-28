const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');

const router = express.Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const dbConnection = require('../database/connection');
    const healthCheck = await dbConnection.healthCheck();
    
    res.status(200).json({
      success: true,
      message: 'Auth service is healthy',
      data: {
        service: 'auth-service',
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
router.use('/auth', authRoutes);
router.use('/auth', userRoutes);

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