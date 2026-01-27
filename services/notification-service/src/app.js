require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const notificationRoutes = require('./routes/notification.routes');
const { initKafka, shutdownKafka } = require('./kafka/consumer');

const app = express();
const PORT = process.env.PORT || 3009;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'NOTIFICATION SERVICE OK',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1/notifications', notificationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ message: 'Internal server error' });
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  await shutdownKafka();
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
  // Connect to MongoDB
  await connectDB();
  
  // Initialize Kafka consumer (non-blocking)
  initKafka().catch(err => console.error('Kafka init error:', err));
  
  app.listen(PORT, () => {
    console.log(`🔔 Notification Service running on port ${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`   API base: http://localhost:${PORT}/api/v1/notifications`);
  });
};

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;

