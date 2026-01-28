const { server } = require('./src/app');
const config = require('./src/config');

const PORT = config.port || 3000;

// Graceful shutdown handling
const shutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  shutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown('UNHANDLED_REJECTION');
});

// Start the server
server.listen(PORT, () => {
  console.log(`
==============================================
🚀  CAB Booking System API Gateway
📡  Server running on port ${PORT}
==============================================
🔗  Health Check: http://localhost:${PORT}/api/v1/health
📚  API Documentation: http://localhost:${PORT}/api/v1/docs
⚡  Environment: ${process.env.NODE_ENV || 'development'}
==============================================
🎯  Services Routing:
    Auth → http://localhost:3001
    User → http://localhost:3002
    Driver → http://localhost:3003
    Booking → http://localhost:3004
    Ride (HTTP) → http://localhost:3005
    Ride (WS) → ws://localhost:3006
    Payment → http://localhost:3007
    Pricing → http://localhost:3008
    Notification → http://localhost:3009
    Review → http://localhost:3010
==============================================
  `);
});

// Export for testing purposes
module.exports = server;