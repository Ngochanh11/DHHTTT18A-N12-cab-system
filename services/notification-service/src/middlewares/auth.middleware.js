const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Authentication middleware for notification service
 * Verifies JWT tokens from API Gateway
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get user info from API Gateway headers
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];
    const userEmail = req.headers['x-user-email'];
    const authHeader = req.headers.authorization;

    // If API Gateway headers are present, use them
    if (userId) {
      req.user = {
        id: userId,
        role: userRole || 'user',
        email: userEmail || ''
      };
      return next();
    }

    // Otherwise, try to verify JWT from Authorization header
    if (authHeader) {
      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;

      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        req.user = {
          id: decoded.userId || decoded.sub,
          role: decoded.role || 'user',
          email: decoded.email || ''
        };
        return next();
      } catch (jwtError) {
        // Token is invalid but continue without auth for public endpoints
        req.user = null;
        return next();
      }
    }

    // No authentication provided
    req.user = null;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    req.user = null;
    next();
  }
};

/**
 * Require authentication middleware
 * Returns 401 if user is not authenticated
 */
const requireAuth = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const authHeader = req.headers.authorization;

    let user = null;

    if (userId) {
      user = {
        id: userId,
        role: req.headers['x-user-role'] || 'user',
        email: req.headers['x-user-email'] || ''
      };
    } else if (authHeader) {
      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;

      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        user = {
          id: decoded.userId || decoded.sub,
          role: decoded.role || 'user',
          email: decoded.email || ''
        };
      } catch (jwtError) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
            timestamp: new Date().toISOString()
          }
        });
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        }
      });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('RequireAuth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error during authentication',
        timestamp: new Date().toISOString()
      }
    });
  }
};

/**
 * Internal API key middleware
 * For service-to-service communication
 */
const internalAuth = (req, res, next) => {
  const internalApiKey = req.headers['x-internal-api-key'];
  
  if (!internalApiKey) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_API_KEY',
        message: 'Internal API key is required',
        timestamp: new Date().toISOString()
      }
    });
  }

  if (internalApiKey !== config.internalApiKey) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'Invalid internal API key',
        timestamp: new Date().toISOString()
      }
    });
  }

  next();
};

module.exports = {
  authMiddleware,
  requireAuth,
  internalAuth
};

