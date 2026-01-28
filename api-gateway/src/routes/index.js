const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('../config');
const authMiddleware = require('../middlewares/auth');
const { serveOpenAPIJson, serveSwaggerUI } = require('../utils/swagger');

const router = express.Router();

// Service routing configuration based on OpenAPI spec
const serviceRoutes = [
  {
    path: '/auth',
    service: 'auth',
    authRequired: false,
    options: {
      target: config.services.auth,
      changeOrigin: true,
      pathRewrite: { '^/api/v1/auth': '/' },
      onProxyReq: addRequestHeaders,
      onError: handleProxyError('auth'),
      timeout: 10000,
    }
  },
  {
    path: '/users',
    service: 'user',
    authRequired: true,
    options: {
      target: config.services.user,
      changeOrigin: true,
      pathRewrite: { '^/api/v1/users': '/' },
      onProxyReq: addRequestHeaders,
      onError: handleProxyError('user'),
      timeout: 10000,
    }
  },
  {
    path: '/drivers',
    service: 'driver',
    authRequired: true,
    options: {
      target: config.services.driver,
      changeOrigin: true,
      pathRewrite: { '^/api/v1/drivers': '/' },
      onProxyReq: addRequestHeaders,
      onError: handleProxyError('driver'),
      timeout: 10000,
    }
  },
  {
    path: '/bookings',
    service: 'booking',
    authRequired: true,
    options: {
      target: config.services.booking,
      changeOrigin: true,
      pathRewrite: { '^/api/v1/bookings': '/' },
      onProxyReq: addRequestHeaders,
      onError: handleProxyError('booking'),
      timeout: 10000,
    }
  },
  {
    path: '/rides',
    service: 'ride',
    authRequired: true,
    options: {
      target: config.services.ride,
      changeOrigin: true,
      pathRewrite: { '^/api/v1/rides': '/' },
      onProxyReq: addRequestHeaders,
      onError: handleProxyError('ride'),
      timeout: 10000,
    }
  },
  {
    path: '/payments',
    service: 'payment',
    authRequired: true,
    options: {
      target: config.services.payment,
      changeOrigin: true,
      pathRewrite: { '^/api/v1/payments': '/' },
      onProxyReq: addRequestHeaders,
      onError: handleProxyError('payment'),
      timeout: 10000,
    }
  },
  {
    path: '/pricings',
    service: 'pricing',
    authRequired: true,
    options: {
      target: config.services.pricing,
      changeOrigin: true,
      pathRewrite: { '^/api/v1/pricings': '/' },
      onProxyReq: addRequestHeaders,
      onError: handleProxyError('pricing'),
      timeout: 10000,
    }
  },
  {
    path: '/notifications',
    service: 'notification',
    authRequired: true,
    options: {
      target: config.services.notification,
      changeOrigin: true,
      pathRewrite: { '^/api/v1/notifications': '/' },
      onProxyReq: addRequestHeaders,
      onError: handleProxyError('notification'),
      timeout: 10000,
    }
  },
  {
    path: '/reviews',
    service: 'review',
    authRequired: true,
    options: {
      target: config.services.review,
      changeOrigin: true,
      pathRewrite: { '^/api/v1/reviews': '/' },
      onProxyReq: addRequestHeaders,
      onError: handleProxyError('review'),
      timeout: 10000,
    }
  },
];

// Helper function to add request headers
function addRequestHeaders(proxyReq, req, res) {
  // Add user context for downstream services
  if (req.user) {
    proxyReq.setHeader('X-User-ID', req.user.id || '');
    proxyReq.setHeader('X-User-Role', req.user.role || '');
    proxyReq.setHeader('X-User-Email', req.user.email || '');
  }
  
  // Add request ID for tracing
  const requestId = req.headers['x-request-id'] || Date.now().toString();
  proxyReq.setHeader('X-Request-ID', requestId);
  
  // Forward original host
  proxyReq.setHeader('X-Forwarded-Host', req.get('host'));
  proxyReq.setHeader('X-Forwarded-Proto', req.protocol);
}

// Helper function to handle proxy errors
function handleProxyError(serviceName) {
  return (err, req, res) => {
    console.error(`[${serviceName}] Proxy error:`, err.message);
    
    const response = {
      error: 'Service Unavailable',
      message: `The ${serviceName} service is currently unavailable. Please try again later.`,
      service: serviceName,
      timestamp: new Date().toISOString()
    };
    
    if (process.env.NODE_ENV === 'development') {
      response.details = err.message;
    }
    
    res.status(503).json(response);
  };
}

// Setup routes with proper authentication
serviceRoutes.forEach(route => {
  if (route.authRequired) {
    router.use(route.path, authMiddleware, createProxyMiddleware(route.options));
  } else {
    router.use(route.path, createProxyMiddleware(route.options));
  }
});

// OpenAPI/Swagger documentation endpoints
router.get('/openapi.json', serveOpenAPIJson);
router.get('/docs', serveSwaggerUI);
router.get('/swagger', serveSwaggerUI);
router.get('/api-docs', serveSwaggerUI);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'api-gateway',
    version: '1.0.0'
  });
});

// Test endpoint for development
router.get('/test', (req, res) => {
  res.status(200).json({
    message: 'API Gateway is working correctly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Method not allowed handler
router.all('*', (req, res) => {
  res.status(405).json({
    error: 'Method Not Allowed',
    message: `${req.method} ${req.path} is not supported`,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  });
});

module.exports = router;