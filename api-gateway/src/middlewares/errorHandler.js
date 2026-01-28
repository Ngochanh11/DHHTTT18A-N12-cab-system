/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error Handler] ${status} - ${message}`);
  console.error(err.stack);

  res.status(status).json({
    error: {
      status: status,
      message: message,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    },
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
