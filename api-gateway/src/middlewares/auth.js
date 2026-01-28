// Simple authentication middleware for now
const authMiddleware = (req, res, next) => {
  // List of public routes that don't need authentication
  const publicRoutes = [
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/refresh',
    '/health',
    '/api/v1/health',
    '/api/v1/test'
  ];

  // Check if current route is public
  if (publicRoutes.includes(req.path)) {
    return next();
  }

  // Check for Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token required'
    });
  }

  // For now, just check if token exists
  // In production, this should validate JWT with Auth Service
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token format'
    });
  }

  // Simulate user extraction from token
  // TODO: Integrate with Auth Service for actual validation
  req.user = {
    id: 'user-id-from-token',
    role: 'user', // Default role
    token: token
  };

  next();
};

module.exports = authMiddleware;