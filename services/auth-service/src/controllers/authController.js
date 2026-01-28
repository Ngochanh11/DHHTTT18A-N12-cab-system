const userService = require('../services/userService');
const tokenService = require('../services/tokenService');
const otpService = require('../services/otpService');
const dbConnection = require('../database/connection');

class AuthController {
  /**
   * Register new user
   * POST /api/v1/auth/register
   */
  async register(req, res) {
    try {
      const { email, password, phone, role } = req.body;

      // Create user
      const user = await userService.createUser({
        email,
        password,
        phone,
        role
      });

      // Generate tokens
      const deviceInfo = {
        userAgent: req.get('User-Agent'),
        ip: req.ip
      };

      const tokens = await tokenService.generateTokens(user, deviceInfo);

      // Log successful registration
      await this.logAuditEvent(req, user.id, 'REGISTER', 'user', true);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: tokens,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });

    } catch (error) {
      console.error('Registration error:', error);

      // Log failed registration
      await this.logAuditEvent(req, null, 'REGISTER', 'user', false, error.message);

      let statusCode = 500;
      let errorCode = 'REGISTRATION_FAILED';
      let errorMessage = 'Registration failed';

      if (error.message === 'EMAIL_EXISTS') {
        statusCode = 409;
        errorCode = 'EMAIL_EXISTS';
        errorMessage = 'Email address is already registered';
      } else if (error.message === 'PHONE_EXISTS') {
        statusCode = 409;
        errorCode = 'PHONE_EXISTS';
        errorMessage = 'Phone number is already registered';
      } else if (error.message.startsWith('WEAK_PASSWORD')) {
        statusCode = 400;
        errorCode = 'WEAK_PASSWORD';
        errorMessage = error.message.replace('WEAK_PASSWORD: ', '');
      }

      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    }
  }

  /**
   * User login with email/phone and password
   * POST /api/v1/auth/login
   */
  async login(req, res) {
    try {
      const { email, phone, password } = req.body;
      const identifier = email || phone;

      if (!identifier) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_IDENTIFIER',
            message: 'Either email or phone is required',
            timestamp: new Date().toISOString(),
            requestId: req.id
          }
        });
      }

      // Find user by email or phone
      const user = await userService.findUserByIdentifier(identifier);

      if (!user) {
        await this.logAuditEvent(req, null, 'LOGIN', 'user', false, 'User not found');
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email/phone or password',
            timestamp: new Date().toISOString(),
            requestId: req.id
          }
        });
      }

      // Check if account is active
      if (!user.isActive) {
        await this.logAuditEvent(req, user.id, 'LOGIN', 'user', false, 'Account disabled');
        return res.status(401).json({
          success: false,
          error: {
            code: 'ACCOUNT_DISABLED',
            message: 'Account is disabled',
            timestamp: new Date().toISOString(),
            requestId: req.id
          }
        });
      }

      // Validate password
      const isPasswordValid = await userService.validatePassword(password, user.passwordHash);

      if (!isPasswordValid) {
        await this.logAuditEvent(req, user.id, 'LOGIN', 'user', false, 'Invalid password');
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email/phone or password',
            timestamp: new Date().toISOString(),
            requestId: req.id
          }
        });
      }

      // Check if MFA is enabled
      if (user.mfaEnabled) {
        // Generate temporary token for MFA verification
        const mfaToken = tokenService.generateAccessToken({
          userId: user.id,
          email: user.email,
          role: user.role,
          mfaRequired: true
        });

        await this.logAuditEvent(req, user.id, 'LOGIN_MFA_REQUIRED', 'user', true);

        return res.status(200).json({
          success: true,
          message: 'MFA verification required',
          data: {
            mfaRequired: true,
            mfaToken,
            user: {
              id: user.id,
              email: user.email,
              role: user.role
            }
          },
          timestamp: new Date().toISOString(),
          requestId: req.id
        });
      }

      // Generate tokens
      const deviceInfo = {
        userAgent: req.get('User-Agent'),
        ip: req.ip
      };

      const tokens = await tokenService.generateTokens(user, deviceInfo);

      // Update last login
      await userService.updateLastLogin(user.id);

      // Log successful login
      await this.logAuditEvent(req, user.id, 'LOGIN', 'user', true);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: tokens,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });

    } catch (error) {
      console.error('Login error:', error);

      await this.logAuditEvent(req, null, 'LOGIN', 'user', false, error.message);

      res.status(500).json({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: 'Login failed',
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    }
  }

  /**
   * Request OTP for phone login
   * POST /api/v1/auth/login/otp
   */
  async loginOTP(req, res) {
    try {
      const { phone } = req.body;

      // Check OTP rate limit
      const rateLimit = await otpService.checkOTPRateLimit(phone);
      if (!rateLimit.allowed) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'OTP_RATE_LIMIT_EXCEEDED',
            message: `Too many OTP requests. Try again after ${Math.ceil((rateLimit.resetTime - new Date()) / 1000 / 60)} minutes`,
            timestamp: new Date().toISOString(),
            requestId: req.id
          }
        });
      }

      // Check if user exists with this phone
      const user = await userService.findUserByPhone(phone);
      if (!user) {
        // Don't reveal if phone exists or not for security
        await this.logAuditEvent(req, null, 'OTP_REQUEST', 'user', false, 'Phone not found');
      } else if (!user.isActive) {
        await this.logAuditEvent(req, user.id, 'OTP_REQUEST', 'user', false, 'Account disabled');
      } else {
        await this.logAuditEvent(req, user.id, 'OTP_REQUEST', 'user', true);
      }

      // Generate and send OTP (always return success for security)
      const otpResult = await otpService.generateOTP(phone);

      res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        data: {
          phone,
          expiresIn: 300 // 5 minutes
        },
        timestamp: new Date().toISOString(),
        requestId: req.id
      });

    } catch (error) {
      console.error('OTP login error:', error);

      await this.logAuditEvent(req, null, 'OTP_REQUEST', 'user', false, error.message);

      let statusCode = 500;
      let errorCode = 'OTP_REQUEST_FAILED';
      let errorMessage = 'Failed to send OTP';

      if (error.message.startsWith('OTP_ALREADY_SENT')) {
        statusCode = 429;
        errorCode = 'OTP_ALREADY_SENT';
        errorMessage = error.message.replace('OTP_ALREADY_SENT: ', '');
      }

      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    }
  }

  /**
   * Verify OTP and login
   * POST /api/v1/auth/verify-otp
   */
  async verifyOTP(req, res) {
    try {
      const { phone, otp } = req.body;

      // Verify OTP
      const otpResult = await otpService.verifyOTP(phone, otp);

      // Find user by phone
      const user = await userService.findUserByPhone(phone);

      if (!user) {
        await this.logAuditEvent(req, null, 'OTP_VERIFY', 'user', false, 'User not found');
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid phone number or OTP',
            timestamp: new Date().toISOString(),
            requestId: req.id
          }
        });
      }

      if (!user.isActive) {
        await this.logAuditEvent(req, user.id, 'OTP_VERIFY', 'user', false, 'Account disabled');
        return res.status(401).json({
          success: false,
          error: {
            code: 'ACCOUNT_DISABLED',
            message: 'Account is disabled',
            timestamp: new Date().toISOString(),
            requestId: req.id
          }
        });
      }

      // Generate tokens
      const deviceInfo = {
        userAgent: req.get('User-Agent'),
        ip: req.ip
      };

      const tokens = await tokenService.generateTokens(user, deviceInfo);

      // Update last login
      await userService.updateLastLogin(user.id);

      // Log successful OTP login
      await this.logAuditEvent(req, user.id, 'OTP_VERIFY', 'user', true);

      res.status(200).json({
        success: true,
        message: 'OTP verification successful',
        data: tokens,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });

    } catch (error) {
      console.error('OTP verification error:', error);

      await this.logAuditEvent(req, null, 'OTP_VERIFY', 'user', false, error.message);

      let statusCode = 400;
      let errorCode = 'OTP_VERIFICATION_FAILED';
      let errorMessage = 'OTP verification failed';

      if (error.message === 'OTP_NOT_FOUND') {
        errorCode = 'OTP_NOT_FOUND';
        errorMessage = 'No valid OTP found for this phone number';
      } else if (error.message === 'OTP_EXPIRED') {
        errorCode = 'OTP_EXPIRED';
        errorMessage = 'OTP has expired';
      } else if (error.message === 'OTP_MAX_ATTEMPTS_EXCEEDED') {
        errorCode = 'OTP_MAX_ATTEMPTS_EXCEEDED';
        errorMessage = 'Maximum OTP attempts exceeded';
      } else if (error.message.startsWith('OTP_INVALID')) {
        errorCode = 'OTP_INVALID';
        errorMessage = error.message.replace('OTP_INVALID: ', 'Invalid OTP. ');
      }

      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  async refresh(req, res) {
    try {
      const { refreshToken } = req.body;

      // Refresh tokens
      const tokens = await tokenService.refreshTokens(refreshToken);

      // Log successful token refresh
      await this.logAuditEvent(req, tokens.user.id, 'TOKEN_REFRESH', 'token', true);

      res.status(200).json({
        success: true,
        message: 'Tokens refreshed successfully',
        data: tokens,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });

    } catch (error) {
      console.error('Token refresh error:', error);

      await this.logAuditEvent(req, null, 'TOKEN_REFRESH', 'token', false, error.message);

      let statusCode = 401;
      let errorCode = 'TOKEN_REFRESH_FAILED';
      let errorMessage = 'Token refresh failed';

      if (['TOKEN_EXPIRED', 'TOKEN_INVALID', 'REFRESH_TOKEN_INVALID'].includes(error.message)) {
        errorCode = error.message;
        errorMessage = 'Invalid or expired refresh token';
      } else if (error.message === 'ACCOUNT_DISABLED') {
        errorCode = 'ACCOUNT_DISABLED';
        errorMessage = 'Account is disabled';
      }

      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    }
  }

  /**
   * Logout user (revoke current refresh token)
   * POST /api/v1/auth/logout
   */
  async logout(req, res) {
    try {
      const tokenId = req.token?.jti;

      if (tokenId) {
        await tokenService.revokeRefreshToken(tokenId);
      }

      // Log successful logout
      await this.logAuditEvent(req, req.user?.id, 'LOGOUT', 'user', true);

      res.status(200).json({
        success: true,
        message: 'Logout successful',
        timestamp: new Date().toISOString(),
        requestId: req.id
      });

    } catch (error) {
      console.error('Logout error:', error);

      await this.logAuditEvent(req, req.user?.id, 'LOGOUT', 'user', false, error.message);

      res.status(500).json({
        success: false,
        error: {
          code: 'LOGOUT_FAILED',
          message: 'Logout failed',
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    }
  }

  /**
   * Logout from all devices (revoke all refresh tokens)
   * POST /api/v1/auth/logout/all
   */
  async logoutAll(req, res) {
    try {
      const userId = req.user.id;

      // Revoke all user tokens
      const revokedCount = await tokenService.revokeAllUserTokens(userId);

      // Log successful logout from all devices
      await this.logAuditEvent(req, userId, 'LOGOUT_ALL', 'user', true, `Revoked ${revokedCount} tokens`);

      res.status(200).json({
        success: true,
        message: `Logout successful from all devices (${revokedCount} sessions terminated)`,
        data: {
          revokedTokens: revokedCount
        },
        timestamp: new Date().toISOString(),
        requestId: req.id
      });

    } catch (error) {
      console.error('Logout all error:', error);

      await this.logAuditEvent(req, req.user?.id, 'LOGOUT_ALL', 'user', false, error.message);

      res.status(500).json({
        success: false,
        error: {
          code: 'LOGOUT_ALL_FAILED',
          message: 'Logout from all devices failed',
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    }
  }

  /**
   * Forgot password - Request password reset
   * POST /api/v1/auth/password/forgot
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      // Find user by email
      const user = await userService.findUserByEmail(email);

      // Don't reveal if email exists or not for security
      if (!user) {
        await this.logAuditEvent(req, null, 'PASSWORD_RESET_REQUEST', 'user', false, 'Email not found');
        // Return success even if user doesn't exist (security best practice)
        return res.status(200).json({
          success: true,
          message: 'If the email exists, a password reset link has been sent',
          timestamp: new Date().toISOString(),
          requestId: req.id
        });
      }

      if (!user.isActive) {
        await this.logAuditEvent(req, user.id, 'PASSWORD_RESET_REQUEST', 'user', false, 'Account disabled');
        return res.status(200).json({
          success: true,
          message: 'If the email exists, a password reset link has been sent',
          timestamp: new Date().toISOString(),
          requestId: req.id
        });
      }

      // Generate password reset token
      const resetTokenData = await tokenService.generatePasswordResetToken(user.id);

      // TODO: Send email with reset link
      // In production, send email with reset link containing the token
      console.log(`📧 [MOCK EMAIL] Password reset link for ${email}: /reset-password?token=${resetTokenData.token}`);

      // Log successful password reset request
      await this.logAuditEvent(req, user.id, 'PASSWORD_RESET_REQUEST', 'user', true);

      res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
        data: {
          expiresIn: 3600 // 1 hour in seconds
        },
        timestamp: new Date().toISOString(),
        requestId: req.id
      });

    } catch (error) {
      console.error('Forgot password error:', error);

      await this.logAuditEvent(req, null, 'PASSWORD_RESET_REQUEST', 'user', false, error.message);

      res.status(500).json({
        success: false,
        error: {
          code: 'PASSWORD_RESET_REQUEST_FAILED',
          message: 'Failed to process password reset request',
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    }
  }

  /**
   * Reset password
   * POST /api/v1/auth/password/reset
   */
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      // Verify reset token
      const tokenData = await tokenService.verifyPasswordResetToken(token);

      // Update password
      await userService.updatePassword(tokenData.user_id, newPassword);

      // Mark token as used
      await tokenService.markResetTokenAsUsed(tokenData.id);

      // Log successful password reset
      await this.logAuditEvent(req, tokenData.user_id, 'PASSWORD_RESET', 'user', true);

      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
        timestamp: new Date().toISOString(),
        requestId: req.id
      });

    } catch (error) {
      console.error('Reset password error:', error);

      await this.logAuditEvent(req, null, 'PASSWORD_RESET', 'user', false, error.message);

      let statusCode = 400;
      let errorCode = 'PASSWORD_RESET_FAILED';
      let errorMessage = 'Password reset failed';

      if (error.message === 'RESET_TOKEN_INVALID') {
        errorCode = 'RESET_TOKEN_INVALID';
        errorMessage = 'Invalid or expired reset token';
      } else if (error.message.startsWith('WEAK_PASSWORD')) {
        errorCode = 'WEAK_PASSWORD';
        errorMessage = error.message.replace('WEAK_PASSWORD: ', '');
      }

      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    }
  }

  /**
   * Enable MFA (for Admin)
   * POST /api/v1/auth/mfa/enable
   */
  async enableMFA(req, res) {
    try {
      const userId = req.user.id;
      const mfaService = require('../services/mfaService');

      // Generate MFA secret
      const mfaData = await mfaService.enableMFA(userId);

      // Log MFA enable request
      await this.logAuditEvent(req, userId, 'MFA_ENABLE_REQUEST', 'mfa', true);

      res.status(200).json({
        success: true,
        message: 'MFA secret generated. Verify with a code to enable.',
        data: {
          secret: mfaData.secret,
          otpauthUrl: mfaData.otpauthUrl,
          manualEntryKey: mfaData.manualEntryKey
        },
        timestamp: new Date().toISOString(),
        requestId: req.id
      });

    } catch (error) {
      console.error('Enable MFA error:', error);

      await this.logAuditEvent(req, req.user?.id, 'MFA_ENABLE_REQUEST', 'mfa', false, error.message);

      res.status(500).json({
        success: false,
        error: {
          code: 'MFA_ENABLE_FAILED',
          message: 'Failed to enable MFA',
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    }
  }

  /**
   * Verify MFA code
   * POST /api/v1/auth/mfa/verify
   */
  async verifyMFA(req, res) {
    try {
      const { token, code } = req.body;
      const mfaService = require('../services/mfaService');

      // Verify token to get user ID
      let userId;
      try {
        const decoded = tokenService.verifyToken(token, 'access');
        userId = decoded.userId;
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired token',
            timestamp: new Date().toISOString(),
            requestId: req.id
          }
        });
      }

      // Check if MFA is required (user has MFA enabled but not verified in this session)
      const user = await userService.findUserById(userId);
      
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

      // If MFA secret exists but not enabled, this is initial setup
      if (user.mfaSecret && !user.mfaEnabled) {
        // Verify and enable MFA
        await mfaService.verifyAndEnableMFA(userId, code);
        
        await this.logAuditEvent(req, userId, 'MFA_ENABLED', 'mfa', true);

        return res.status(200).json({
          success: true,
          message: 'MFA enabled successfully',
          timestamp: new Date().toISOString(),
          requestId: req.id
        });
      }

      // Otherwise, verify MFA code for login
      await mfaService.verifyMFACode(userId, code);

      // Generate tokens after MFA verification
      const deviceInfo = {
        userAgent: req.get('User-Agent'),
        ip: req.ip
      };

      const tokens = await tokenService.generateTokens(user, deviceInfo);
      await userService.updateLastLogin(userId);

      await this.logAuditEvent(req, userId, 'MFA_VERIFY', 'mfa', true);

      res.status(200).json({
        success: true,
        message: 'MFA verification successful',
        data: tokens,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });

    } catch (error) {
      console.error('Verify MFA error:', error);

      await this.logAuditEvent(req, null, 'MFA_VERIFY', 'mfa', false, error.message);

      let statusCode = 400;
      let errorCode = 'MFA_VERIFICATION_FAILED';
      let errorMessage = 'MFA verification failed';

      if (error.message === 'MFA_INVALID_CODE') {
        errorCode = 'MFA_INVALID_CODE';
        errorMessage = 'Invalid MFA code';
      } else if (error.message === 'MFA_NOT_ENABLED' || error.message === 'MFA_NOT_SETUP') {
        errorCode = error.message;
        errorMessage = 'MFA is not enabled for this account';
      }

      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    }
  }

  /**
   * Revoke token (Admin only)
   * POST /api/v1/auth/tokens/revoke
   */
  async revokeToken(req, res) {
    try {
      const { userId, tokenId } = req.body;

      // If tokenId is provided, revoke specific token
      if (tokenId) {
        const revoked = await tokenService.revokeRefreshToken(tokenId);
        
        if (!revoked) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'TOKEN_NOT_FOUND',
              message: 'Token not found or already revoked',
              timestamp: new Date().toISOString(),
              requestId: req.id
            }
          });
        }

        await this.logAuditEvent(req, req.user.id, 'TOKEN_REVOKE', 'token', true, `Revoked token: ${tokenId} for user: ${userId}`);

        return res.status(200).json({
          success: true,
          message: 'Token revoked successfully',
          timestamp: new Date().toISOString(),
          requestId: req.id
        });
      }

      // Otherwise, revoke all tokens for user
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_USER_ID',
            message: 'User ID is required',
            timestamp: new Date().toISOString(),
            requestId: req.id
          }
        });
      }

      const revokedCount = await tokenService.revokeAllUserTokens(userId);

      await this.logAuditEvent(req, req.user.id, 'TOKEN_REVOKE_ALL', 'token', true, `Revoked all tokens for user: ${userId}`);

      res.status(200).json({
        success: true,
        message: `Successfully revoked ${revokedCount} token(s)`,
        data: {
          revokedCount
        },
        timestamp: new Date().toISOString(),
        requestId: req.id
      });

    } catch (error) {
      console.error('Revoke token error:', error);

      await this.logAuditEvent(req, req.user?.id, 'TOKEN_REVOKE', 'token', false, error.message);

      res.status(500).json({
        success: false,
        error: {
          code: 'TOKEN_REVOCATION_FAILED',
          message: 'Failed to revoke token',
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    }
  }

  /**
   * Log audit event
   * @param {Object} req - Request object
   * @param {string} userId - User ID
   * @param {string} action - Action performed
   * @param {string} resource - Resource affected
   * @param {boolean} success - Success status
   * @param {string} errorMessage - Error message if failed
   */
  async logAuditEvent(req, userId, action, resource, success, errorMessage = null) {
    try {
      await dbConnection.query(
        `INSERT INTO audit_logs (user_id, action, resource, ip_address, user_agent, success, error_message, metadata) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
          action,
          resource,
          req.ip,
          req.get('User-Agent'),
          success,
          errorMessage,
          JSON.stringify({
            requestId: req.id,
            timestamp: new Date().toISOString()
          })
        ]
      );
    } catch (error) {
      console.error('Audit logging error:', error);
      // Don't throw error for audit logging failures
    }
  }
}

module.exports = new AuthController();