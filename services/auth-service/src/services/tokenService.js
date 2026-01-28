const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const dbConnection = require('../database/connection');

class TokenService {
  /**
   * Generate access token
   * @param {Object} payload - Token payload
   * @returns {string} JWT access token
   */
  generateAccessToken(payload) {
    const tokenPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      jti: uuidv4(), // JWT ID for token tracking
      iat: Math.floor(Date.now() / 1000),
      type: 'access'
    };

    return jwt.sign(tokenPayload, config.jwt.accessTokenSecret, {
      expiresIn: config.jwt.accessTokenExpiry,
      issuer: 'auth-service',
      audience: 'ride-sharing-system'
    });
  }

  /**
   * Generate refresh token and store in database
   * @param {Object} payload - Token payload
   * @param {Object} deviceInfo - Device information
   * @returns {Object} Refresh token data
   */
  async generateRefreshToken(payload, deviceInfo = {}) {
    try {
      const tokenId = uuidv4();
      const tokenPayload = {
        userId: payload.userId,
        jti: tokenId,
        type: 'refresh'
      };

      const refreshToken = jwt.sign(tokenPayload, config.jwt.refreshTokenSecret, {
        expiresIn: config.jwt.refreshTokenExpiry,
        issuer: 'auth-service',
        audience: 'ride-sharing-system'
      });

      // Calculate expiration date
      const expiresAt = new Date();
      const expiryDays = parseInt(config.jwt.refreshTokenExpiry.replace('d', ''));
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      // Store refresh token in database
      await dbConnection.query(
        `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, device_info) 
         VALUES ($1, $2, $3, $4, $5)`,
        [
          tokenId,
          payload.userId,
          this.hashToken(refreshToken),
          expiresAt,
          JSON.stringify(deviceInfo)
        ]
      );

      return {
        token: refreshToken,
        id: tokenId,
        expiresAt
      };

    } catch (error) {
      console.error('Generate refresh token error:', error);
      throw new Error('REFRESH_TOKEN_GENERATION_FAILED');
    }
  }

  /**
   * Generate token pair (access + refresh)
   * @param {Object} user - User object
   * @param {Object} deviceInfo - Device information
   * @returns {Object} Token pair
   */
  async generateTokens(user, deviceInfo = {}) {
    try {
      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role
      };

      const accessToken = this.generateAccessToken(payload);
      const refreshTokenData = await this.generateRefreshToken(payload, deviceInfo);

      // Calculate access token expiry
      const accessTokenExpiry = this.getTokenExpiry(config.jwt.accessTokenExpiry);

      return {
        accessToken,
        refreshToken: refreshTokenData.token,
        expiresIn: Math.floor((accessTokenExpiry - Date.now()) / 1000),
        tokenType: 'Bearer',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified
        }
      };

    } catch (error) {
      console.error('Generate tokens error:', error);
      throw new Error('TOKEN_GENERATION_FAILED');
    }
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @param {string} type - Token type ('access' or 'refresh')
   * @returns {Object} Decoded token
   */
  verifyToken(token, type = 'access') {
    try {
      const secret = type === 'access' 
        ? config.jwt.accessTokenSecret 
        : config.jwt.refreshTokenSecret;

      const decoded = jwt.verify(token, secret, {
        issuer: 'auth-service',
        audience: 'ride-sharing-system'
      });

      if (decoded.type !== type) {
        throw new Error('INVALID_TOKEN_TYPE');
      }

      return decoded;

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('TOKEN_EXPIRED');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('TOKEN_INVALID');
      } else if (error.message === 'INVALID_TOKEN_TYPE') {
        throw new Error('INVALID_TOKEN_TYPE');
      }
      
      throw new Error('TOKEN_VERIFICATION_FAILED');
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Object} New token pair
   */
  async refreshTokens(refreshToken) {
    try {
      // Verify refresh token
      const decoded = this.verifyToken(refreshToken, 'refresh');

      // Check if refresh token exists in database and is not revoked
      const tokenResult = await dbConnection.query(
        `SELECT rt.*, u.id, u.email, u.role, u.is_active, u.is_verified 
         FROM refresh_tokens rt 
         JOIN users u ON rt.user_id = u.id 
         WHERE rt.id = $1 AND rt.revoked_at IS NULL AND rt.expires_at > NOW()`,
        [decoded.jti]
      );

      if (tokenResult.rows.length === 0) {
        throw new Error('REFRESH_TOKEN_INVALID');
      }

      const tokenData = tokenResult.rows[0];

      if (!tokenData.is_active) {
        throw new Error('ACCOUNT_DISABLED');
      }

      // Generate new token pair
      const user = {
        id: tokenData.id,
        email: tokenData.email,
        role: tokenData.role,
        isVerified: tokenData.is_verified
      };

      const deviceInfo = tokenData.device_info ? JSON.parse(tokenData.device_info) : {};
      const newTokens = await this.generateTokens(user, deviceInfo);

      // Revoke old refresh token
      await this.revokeRefreshToken(decoded.jti);

      return newTokens;

    } catch (error) {
      console.error('Refresh tokens error:', error);
      
      if (['TOKEN_EXPIRED', 'TOKEN_INVALID', 'REFRESH_TOKEN_INVALID', 'ACCOUNT_DISABLED'].includes(error.message)) {
        throw error;
      }
      
      throw new Error('TOKEN_REFRESH_FAILED');
    }
  }

  /**
   * Revoke refresh token
   * @param {string} tokenId - Token ID
   * @returns {boolean} Success status
   */
  async revokeRefreshToken(tokenId) {
    try {
      const result = await dbConnection.query(
        'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE id = $1 AND revoked_at IS NULL',
        [tokenId]
      );

      return result.rowCount > 0;

    } catch (error) {
      console.error('Revoke refresh token error:', error);
      throw new Error('TOKEN_REVOCATION_FAILED');
    }
  }

  /**
   * Revoke all user refresh tokens
   * @param {string} userId - User ID
   * @returns {number} Number of revoked tokens
   */
  async revokeAllUserTokens(userId) {
    try {
      const result = await dbConnection.query(
        'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND revoked_at IS NULL',
        [userId]
      );

      console.log(`✅ Revoked ${result.rowCount} tokens for user: ${userId}`);
      return result.rowCount;

    } catch (error) {
      console.error('Revoke all user tokens error:', error);
      throw new Error('TOKEN_REVOCATION_FAILED');
    }
  }

  /**
   * Clean up expired refresh tokens
   * @returns {number} Number of cleaned tokens
   */
  async cleanupExpiredTokens() {
    try {
      const result = await dbConnection.query(
        'DELETE FROM refresh_tokens WHERE expires_at < NOW()'
      );

      if (result.rowCount > 0) {
        console.log(`🧹 Cleaned up ${result.rowCount} expired refresh tokens`);
      }

      return result.rowCount;

    } catch (error) {
      console.error('Cleanup expired tokens error:', error);
      return 0;
    }
  }

  /**
   * Get user active tokens
   * @param {string} userId - User ID
   * @returns {Array} Active tokens
   */
  async getUserActiveTokens(userId) {
    try {
      const result = await dbConnection.query(
        `SELECT id, expires_at, device_info, created_at 
         FROM refresh_tokens 
         WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW() 
         ORDER BY created_at DESC`,
        [userId]
      );

      return result.rows.map(row => ({
        id: row.id,
        expiresAt: row.expires_at,
        deviceInfo: row.device_info ? JSON.parse(row.device_info) : {},
        createdAt: row.created_at
      }));

    } catch (error) {
      console.error('Get user active tokens error:', error);
      throw new Error('TOKEN_LOOKUP_FAILED');
    }
  }

  /**
   * Validate token blacklist (for logout)
   * @param {string} jti - JWT ID
   * @returns {boolean} Is token blacklisted
   */
  async isTokenBlacklisted(jti) {
    try {
      // Check if access token is in blacklist (revoked refresh tokens)
      const result = await dbConnection.query(
        'SELECT id FROM refresh_tokens WHERE id = $1 AND revoked_at IS NOT NULL',
        [jti]
      );

      return result.rows.length > 0;

    } catch (error) {
      console.error('Token blacklist check error:', error);
      return false; // Allow access if check fails
    }
  }

  /**
   * Hash token for storage
   * @param {string} token - Token to hash
   * @returns {string} Hashed token
   */
  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Get token expiry timestamp
   * @param {string} expiry - Expiry string (e.g., '15m', '7d')
   * @returns {number} Expiry timestamp
   */
  getTokenExpiry(expiry) {
    const now = Date.now();
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1));

    switch (unit) {
      case 's': return now + (value * 1000);
      case 'm': return now + (value * 60 * 1000);
      case 'h': return now + (value * 60 * 60 * 1000);
      case 'd': return now + (value * 24 * 60 * 60 * 1000);
      default: return now + (15 * 60 * 1000); // Default 15 minutes
    }
  }

  /**
   * Generate password reset token
   * @param {string} userId - User ID
   * @returns {Object} Reset token data
   */
  async generatePasswordResetToken(userId) {
    try {
      const tokenId = uuidv4();
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = this.hashToken(token);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token
      await dbConnection.query(
        `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) 
         VALUES ($1, $2, $3, $4)`,
        [tokenId, userId, tokenHash, expiresAt]
      );

      return {
        token,
        id: tokenId,
        expiresAt
      };

    } catch (error) {
      console.error('Generate password reset token error:', error);
      throw new Error('RESET_TOKEN_GENERATION_FAILED');
    }
  }

  /**
   * Verify password reset token
   * @param {string} token - Reset token
   * @returns {Object} Token data
   */
  async verifyPasswordResetToken(token) {
    try {
      const tokenHash = this.hashToken(token);

      const result = await dbConnection.query(
        `SELECT id, user_id, expires_at 
         FROM password_reset_tokens 
         WHERE token_hash = $1 AND used = false AND expires_at > NOW()`,
        [tokenHash]
      );

      if (result.rows.length === 0) {
        throw new Error('RESET_TOKEN_INVALID');
      }

      return result.rows[0];

    } catch (error) {
      console.error('Verify password reset token error:', error);
      
      if (error.message === 'RESET_TOKEN_INVALID') {
        throw error;
      }
      
      throw new Error('RESET_TOKEN_VERIFICATION_FAILED');
    }
  }

  /**
   * Mark password reset token as used
   * @param {string} tokenId - Token ID
   * @returns {boolean} Success status
   */
  async markResetTokenAsUsed(tokenId) {
    try {
      const result = await dbConnection.query(
        'UPDATE password_reset_tokens SET used = true WHERE id = $1',
        [tokenId]
      );

      return result.rowCount > 0;

    } catch (error) {
      console.error('Mark reset token as used error:', error);
      throw new Error('RESET_TOKEN_UPDATE_FAILED');
    }
  }
}

module.exports = new TokenService();