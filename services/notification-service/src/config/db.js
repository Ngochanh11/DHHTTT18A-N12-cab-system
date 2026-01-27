const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUrl = process.env.DATABASE_URL || 'mongodb://admin:admin123@mongodb:27017/notification_db?authSource=admin';
    
    await mongoose.connect(mongoUrl);
    console.log('✅ MongoDB connected for Notification Service');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
  }
};

module.exports = connectDB;

