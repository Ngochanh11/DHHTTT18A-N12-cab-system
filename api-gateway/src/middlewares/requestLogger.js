const logger = require('../utils/logger');

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Generate request ID if not provided
  if (!req.headers['x-request-id']) {
    req.headers['x-request-id'] = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Attach request ID to response headers
  res.setHeader('X-Request-ID', req.headers['x-request-id']);

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    
    const logData = {
      requestId: req.headers['x-request-id'],
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      userAgent: req.get('user-agent'),
      ip: req.ip || req.connection.remoteAddress
    };

    // Log at appropriate level based on status code
    if (res.statusCode >= 500) {
      logger.error('HTTP Request', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }

    originalEnd.apply(res, args);
  };

  next();
};

module.exports = requestLogger;
