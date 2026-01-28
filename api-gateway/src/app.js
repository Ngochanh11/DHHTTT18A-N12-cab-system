const express = require('express');
const cors = require('cors');
const http = require('http');
const config = require('./config');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const requestLogger = require('./middlewares/requestLogger');
const rateLimit = require('./middlewares/rateLimit');
const rideWebSocketProxy = require('./websocket/proxy');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);

// Middleware setup
// CORS
app.use(cors(config.corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging
app.use(requestLogger);

// Rate limiting
app.use(rateLimit);

// Health check endpoints (bypass rate limiting)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: config.port,
  });
});

// Test endpoint
app.get('/api/v1/test', (req, res) => {
  res.json({
    message: 'API Gateway is working!',
    timestamp: new Date().toISOString(),
    requestId: req.id,
  });
});

// Mount routes (service proxying)
app.use('/api/v1', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use(errorHandler);

// WebSocket upgrade handler
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

  if (pathname === '/api/v1/ws/ride' || pathname === '/ws/ride') {
    // Handle WebSocket connection for ride updates
    rideWebSocketProxy.handleUpgrade(request, socket, head, (ws) => {
      logger.info(`WebSocket connection established for ride updates`);
    });
  } else {
    // Close connection for unknown endpoints
    socket.destroy();
  }
});

// Error handling
server.on('error', (err) => {
  logger.error('Server error:', err);
});

module.exports = { app, server };
