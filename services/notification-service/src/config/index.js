require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3009,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // MongoDB configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/notification_db?authSource=admin',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },
  
  // Redis configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    keyPrefix: 'notification:',
  },
  
  // Kafka configuration
  kafka: {
    brokers: process.env.KAFKA_BROKERS || 'localhost:9092',
    clientId: 'notification-service',
    groupId: 'notification-service-group',
    topics: {
      notifications: 'notifications',
      rideUpdates: 'ride-updates',
      payments: 'payment-events',
    }
  },
  
  // JWT configuration (for internal auth)
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  
  // Internal API key for service-to-service communication
  internalApiKey: process.env.INTERNAL_API_KEY || 'internal-api-key-12345',
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  
  // Pagination defaults
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  
  // Notification types
  notificationTypes: [
    'ride_update',
    'payment',
    'promotion',
    'system',
    'security'
  ],
  
  // Channels
  channels: {
    push: 'push',
    sms: 'sms',
    email: 'email'
  }
};

