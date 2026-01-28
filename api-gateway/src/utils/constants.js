/**
 * Application constants
 */

const CONSTANTS = {
  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },

  // User Roles
  USER_ROLES: {
    ADMIN: 'admin',
    DRIVER: 'driver',
    CUSTOMER: 'customer',
  },

  // Service Names
  SERVICES: {
    AUTH: 'auth',
    USER: 'user',
    DRIVER: 'driver',
    BOOKING: 'booking',
    RIDE: 'ride',
    PAYMENT: 'payment',
    PRICING: 'pricing',
    NOTIFICATION: 'notification',
    REVIEW: 'review',
  },

  // Ride Statuses
  RIDE_STATUS: {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    ONGOING: 'ongoing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },

  // Booking Statuses
  BOOKING_STATUS: {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },

  // Payment Statuses
  PAYMENT_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded',
  },

  // Error Messages
  ERROR_MESSAGES: {
    UNAUTHORIZED: 'Authentication token required or invalid',
    FORBIDDEN: 'You do not have permission to access this resource',
    NOT_FOUND: 'Resource not found',
    SERVICE_UNAVAILABLE: 'Service is temporarily unavailable',
    INVALID_INPUT: 'Invalid input provided',
    INTERNAL_ERROR: 'An unexpected error occurred',
  },

  // Timeouts (in milliseconds)
  TIMEOUTS: {
    SERVICE_PROXY: 10000,
    DATABASE: 5000,
    EXTERNAL_API: 15000,
  },

  // Cache settings
  CACHE: {
    DRIVER_LOCATION_TTL: 60, // 1 minute
    RIDE_STATUS_TTL: 30,     // 30 seconds
    USER_PROFILE_TTL: 300,   // 5 minutes
  },
};

module.exports = CONSTANTS;
