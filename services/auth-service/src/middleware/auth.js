const jwt = require('jsonwebtoken');
const config = require('../config');
const dbConnection = require('../database/connection');

class AuthMiddleware {
  // Verify JWT token and attach user to request
  static async verifyToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'MISSING_TOKEN',
            message: 'Authorization header is required',
            timestamp: new Date().toISOString(),
            requestId: req.id
          }
        });
      }

      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;

      if (!token) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN_FORMAT',
            message: 'Token must be provided in Bearer format',
            timestamp: new Date().toISOString(),
            requestId: req.id
          }
        });
      }

      // Verify JWT token
      let decoded;
      try {
        decoded = jwt.verify(token, config.jwt.accessTokenSecret);
      } catch (jwtError) {
        let errorCode = 'TOKEN_INVALID';
        let errorMessage = 'Invalid token';

        if (jwtError.name === 'TokenExpiredError') {
          errorCode = 'TOKEN_EXPIRED';
          errorMessage = 'Token has expired';
        } else if (jwtError.name === 'JsonWebTokenError') {
          errorCode = 'TOKEN_MALFORMED';
          errorMessage = 'Token is malformed';
        }

        return res.status(401).json({
          success: false,
          error: {
            code: errorCode,
            message: errorMessage,
            timestamp: new Date().toISOString(),
            requestId: req.id
          }
        });
      }

      // Check if user still exists and is active
      const userResult = await dbConnection.query(
        'SELECT id, email, phone, role, is_active, is_verified, mfa_enabled FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User associated with token not found',
            timestamp: new Date().toISOString(),
            requestId: req.id
          }
        });
      }

      const user = userResult.rows[0];

      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'ACCOUNT_DISABLED',
            message: 'User account is disabled',
            timestamp: new Date().toISOString(),
            requestId: req.id
          }
        });
      }

      // Attach user and token info to request
      req.user = {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.is_active,
        isVerified: user.is_verified,
        mfaEnabled: user.mfa_enabled
      };

      req.token = {
        jti: decoded.jti,
        iat: decoded.iat,
        exp: decoded.exp
      };

      next();

    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error during authentication',
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    }
  }

  // Optional authentication - doesn't fail if no token provided
  static async optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      req.user = null;
      return next();
    }

    // Use the same verification logic but don't fail on errors
    try {
      await AuthMiddleware.verifyToken(req, res, next);
    } catch (error) {
      req.user = null;
      next();
    }
  }

  // Require specific roles
  static requireRole(...allowedRoles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication is required',
            timestamp: new Date().toISOString(),
            requestId: req.id
          }
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
            timestamp: new Date().toISOString(),
            requestId: req.id
          }
        });
      }

      next();
    };
  }

  // Require admin role
  static requireAdmin(req, res, next) {
    return AuthMiddleware.requireRole('admin')(req, res, next);
  }

  // Require user to be verified
  static requireVerified(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required',
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    }

    if (!req.user.isVerified) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_NOT_VERIFIED',
          message: 'Account verification is required',
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    }

    next();
  }

  // Check if user owns resource or is admin
  static requireOwnershipOrAdmin(userIdField = 'userId') {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication is required',
            timestamp: new Date().toISOString(),
            requestId: req.id
          }
        });
      }

      const resourceUserId = req.params[userIdField] || req.body[userIdField];
      
      if (req.user.role === 'admin' || req.user.id === resourceUserId) {
        return next();
      }

      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You can only access your own resources',
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    };
  }

  // Check if refresh token is valid and not revoked
  static async verifyRefreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REFRESH_TOKEN',
            message: 'Refresh token is required',
            timestamp: new Date().toISOString(),
            requestId: req.id
          }
        });
      }

      // Verify JWT refresh token
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, config.jwt.refreshTokenSecret);
      } catch (jwtError) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: 'Invalid or expired refresh token',
            timestamp: new Date().toISOString(),
            requestId: req.id
          }
        });
      }

      // Check if refresh token exists in database and is not revoked
      const tokenResult = await dbConnection.query(
        `SELECT rt.*, u.id as user_id, u.email, u.role, u.is_active 
         FROM refresh_tokens rt 
         JOIN users u ON rt.user_id = u.id 
         WHERE rt.id = $1 AND rt.revoked_at IS NULL AND rt.expires_at > NOW()`,
        [decoded.jti]
      );

      if (tokenResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'REFRESH_TOKEN_INVALID',
            message: 'Refresh token is invalid or has been revoked',
            timestamp: new Date().toISOString(),
            requestId: req.id
          }
        });
      }

      const tokenData = tokenResult.rows[0];

      if (!tokenData.is_active) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'ACCOUNT_DISABLED',
            message: 'User account is disabled',
            timestamp: new Date().toISOString(),
            requestId: req.id
          }
        });
      }

      // Attach user and token info to request
      req.user = {
        id: tokenData.user_id,
        email: tokenData.email,
        role: tokenData.role,
        isActive: tokenData.is_active
      };

      req.refreshTokenData = {
        id: tokenData.id,
        userId: tokenData.user_id,
        expiresAt: tokenData.expires_at,
        deviceInfo: tokenData.device_info
      };

      next();

    } catch (error) {
      console.error('Refresh token verification error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error during token verification',
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    }
  }

  // Rate limiting check for sensitive operations
  static async checkRateLimit(action, identifier, maxAttempts, windowMinutes) {
    try {
      const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
      
      const result = await dbConnection.query(
        `SELECT COUNT(*) as attempt_count 
         FROM audit_logs 
         WHERE action = $1 
         AND (ip_address = $2 OR user_id = $3)
         AND created_at > $4
         AND success = false`,
        [action, identifier, identifier, windowStart]
      );

      const attemptCount = parseInt(result.rows[0].attempt_count);
      
      return {
        allowed: attemptCount < maxAttempts,
        attempts: attemptCount,
        maxAttempts,
        resetTime: new Date(Date.now() + windowMinutes * 60 * 1000)
      };

    } catch (error) {
      console.error('Rate limit check error:', error);
      // Allow request if rate limit check fails
      return { allowed: true, attempts: 0, maxAttempts };
    }
  }
}

module.exports = AuthMiddleware;