const express = require('express');
const authController = require('../controllers/authController');
const { validate } = require('../middleware/validation');
const AuthMiddleware = require('../middleware/auth');
const { 
  registrationRateLimit, 
  loginRateLimit, 
  otpRateLimit 
} = require('../middleware/rateLimit');

const router = express.Router();

// Public routes (no authentication required)

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', 
  registrationRateLimit,
  validate('register'),
  authController.register.bind(authController)
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login with email/phone and password
 * @access  Public
 */
router.post('/login',
  loginRateLimit,
  validate('login'),
  authController.login.bind(authController)
);

/**
 * @route   POST /api/v1/auth/login/otp
 * @desc    Request OTP for phone login
 * @access  Public
 */
router.post('/login/otp',
  otpRateLimit,
  validate('loginOTP'),
  authController.loginOTP.bind(authController)
);

/**
 * @route   POST /api/v1/auth/verify-otp
 * @desc    Verify OTP and login
 * @access  Public
 */
router.post('/verify-otp',
  otpRateLimit,
  validate('verifyOTP'),
  authController.verifyOTP.bind(authController)
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public (requires refresh token)
 */
router.post('/refresh',
  validate('refresh'),
  AuthMiddleware.verifyRefreshToken,
  authController.refresh.bind(authController)
);

// Protected routes (authentication required)

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (revoke current refresh token)
 * @access  Private
 */
router.post('/logout',
  AuthMiddleware.verifyToken,
  authController.logout.bind(authController)
);

/**
 * @route   POST /api/v1/auth/logout/all
 * @desc    Logout from all devices (revoke all refresh tokens)
 * @access  Private
 */
router.post('/logout/all',
  AuthMiddleware.verifyToken,
  authController.logoutAll.bind(authController)
);

/**
 * @route   POST /api/v1/auth/password/forgot
 * @desc    Request password reset
 * @access  Public
 */
router.post('/password/forgot',
  validate('forgotPassword'),
  authController.forgotPassword.bind(authController)
);

/**
 * @route   POST /api/v1/auth/password/reset
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/password/reset',
  validate('resetPassword'),
  authController.resetPassword.bind(authController)
);

/**
 * @route   POST /api/v1/auth/mfa/enable
 * @desc    Enable MFA (for Admin)
 * @access  Private
 */
router.post('/mfa/enable',
  AuthMiddleware.verifyToken,
  authController.enableMFA.bind(authController)
);

/**
 * @route   POST /api/v1/auth/mfa/verify
 * @desc    Verify MFA code
 * @access  Public (requires token in body)
 */
router.post('/mfa/verify',
  validate('verifyMFA'),
  authController.verifyMFA.bind(authController)
);

/**
 * @route   POST /api/v1/auth/tokens/revoke
 * @desc    Revoke token (Admin only)
 * @access  Private (Admin)
 */
router.post('/tokens/revoke',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireAdmin,
  validate('revokeToken'),
  authController.revokeToken.bind(authController)
);

module.exports = router;