const express = require('express');
const userService = require('../services/userService');
const AuthMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', 
  AuthMiddleware.verifyToken,
  async (req, res) => {
    try {
      const user = await userService.findUserById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString(),
            requestId: req.id
          }
        });
      }

      res.status(200).json({
        success: true,
        message: 'User profile retrieved successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive,
            isVerified: user.isVerified,
            mfaEnabled: user.mfaEnabled,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLogin: user.lastLogin
          }
        },
        timestamp: new Date().toISOString(),
        requestId: req.id
      });

    } catch (error) {
      console.error('Get profile error:', error);

      res.status(500).json({
        success: false,
        error: {
          code: 'PROFILE_RETRIEVAL_FAILED',
          message: 'Failed to retrieve user profile',
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    }
  }
);

/**
 * @route   GET /api/v1/auth/tokens/validate
 * @desc    Validate current token
 * @access  Private
 */
router.get('/tokens/validate',
  AuthMiddleware.verifyToken,
  async (req, res) => {
    try {
      res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: {
          valid: true,
          user: {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
            isActive: req.user.isActive,
            isVerified: req.user.isVerified
          },
          token: {
            jti: req.token.jti,
            iat: req.token.iat,
            exp: req.token.exp
          }
        },
        timestamp: new Date().toISOString(),
        requestId: req.id
      });

    } catch (error) {
      console.error('Token validation error:', error);

      res.status(500).json({
        success: false,
        error: {
          code: 'TOKEN_VALIDATION_FAILED',
          message: 'Token validation failed',
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    }
  }
);

module.exports = router;