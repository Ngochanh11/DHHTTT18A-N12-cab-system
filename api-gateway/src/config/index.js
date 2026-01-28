const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    port: process.env.PORT || 3000,
  // Các service endpoints
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    user: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    driver: process.env.DRIVER_SERVICE_URL || 'http://localhost:3003',
    booking: process.env.BOOKING_SERVICE_URL || 'http://localhost:3004',
    ride: process.env.RIDE_SERVICE_URL || 'http://localhost:3005',
    payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3007',
    pricing: process.env.PRICING_SERVICE_URL || 'http://localhost:3008',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3009',
    review: process.env.REVIEW_SERVICE_URL || 'http://localhost:3010',
  },
  // Ride WebSocket (có thể dùng port 3006 cho WebSocket)
  rideWebSocket: process.env.RIDE_WS_URL || 'http://localhost:3006',

  // JWT secret (nếu dùng symmetric key) hoặc public key (nếu dùng asymmetric)
  jwtSecret: process.env.JWT_SECRET,

  // Rate limiting config
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
  
  // CORS config
  corsOptions: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  },
};