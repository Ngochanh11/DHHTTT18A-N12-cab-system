const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/database');
const reviewRoutes = require('./routes/reviewRoutes');
const kafkaService = require('./services/kafkaService');

const app = express();
const PORT = process.env.PORT || 4006;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Review Service OK',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/v1/reviews', reviewRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Lỗi server không xác định'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint không tồn tại'
  });
});

// Khởi tạo database và server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Review Service running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📝 API docs: http://localhost:${PORT}/api/reviews`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  kafkaService.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  kafkaService.close();
  process.exit(0);
});

startServer();
