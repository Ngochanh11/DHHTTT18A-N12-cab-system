const speakeasy = require('speakeasy');
const userService = require('./userService');

class MFAService {
  /**
   * Enable MFA for a user (TOTP)
   * @param {string} userId - User ID
   * @returns {Object} MFA setup data
   */
  async enableMFA(userId) {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `Auth Service (${userId})`,
        issuer: 'Ride Sharing System'
      });

      // Update user with MFA secret
      await userService.updateUser(userId, {
        mfa_enabled: false, // Not enabled until verified
        mfa_secret: secret.base32
      });

      return {
        secret: secret.base32,
        otpauthUrl: secret.otpauth_url,
        manualEntryKey: secret.base32,
        message: 'MFA secret generated. Please verify with a code to enable MFA.'
      };

    } catch (error) {
      console.error('Enable MFA error:', error);
      throw new Error('MFA_ENABLE_FAILED');
    }
  }

  /**
   * Verify MFA code and enable MFA
   * @param {string} userId - User ID
   * @param {string} code - MFA code
   * @returns {boolean} Success status
   */
  async verifyAndEnableMFA(userId, code) {
    try {
      // Get user with MFA secret
      const user = await userService.findUserById(userId);
      
      if (!user || !user.mfaSecret) {
        throw new Error('MFA_NOT_SETUP');
      }

      // Verify TOTP code
      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: code,
        window: 2 // Allow 2 time steps before/after
      });

      if (!verified) {
        throw new Error('MFA_INVALID_CODE');
      }

      // Enable MFA for user
      await userService.updateUser(userId, {
        mfa_enabled: true
      });

      console.log(`✅ MFA enabled for user: ${userId}`);
      return true;

    } catch (error) {
      console.error('Verify and enable MFA error:', error);
      
      if (['MFA_NOT_SETUP', 'MFA_INVALID_CODE'].includes(error.message)) {
        throw error;
      }
      
      throw new Error('MFA_VERIFICATION_FAILED');
    }
  }

  /**
   * Verify MFA code during login
   * @param {string} userId - User ID
   * @param {string} code - MFA code
   * @returns {boolean} Success status
   */
  async verifyMFACode(userId, code) {
    try {
      // Get user with MFA secret
      const user = await userService.findUserById(userId);
      
      if (!user || !user.mfaEnabled || !user.mfaSecret) {
        throw new Error('MFA_NOT_ENABLED');
      }

      // Verify TOTP code
      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: code,
        window: 2 // Allow 2 time steps before/after
      });

      if (!verified) {
        throw new Error('MFA_INVALID_CODE');
      }

      return true;

    } catch (error) {
      console.error('Verify MFA code error:', error);
      
      if (['MFA_NOT_ENABLED', 'MFA_INVALID_CODE'].includes(error.message)) {
        throw error;
      }
      
      throw new Error('MFA_VERIFICATION_FAILED');
    }
  }

  /**
   * Disable MFA for a user
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  async disableMFA(userId) {
    try {
      await userService.updateUser(userId, {
        mfa_enabled: false,
        mfa_secret: null
      });

      console.log(`✅ MFA disabled for user: ${userId}`);
      return true;

    } catch (error) {
      console.error('Disable MFA error:', error);
      throw new Error('MFA_DISABLE_FAILED');
    }
  }

  /**
   * Check if MFA is enabled for user
   * @param {string} userId - User ID
   * @returns {boolean} MFA enabled status
   */
  async isMFAEnabled(userId) {
    try {
      const user = await userService.findUserById(userId);
      return user && user.mfaEnabled === true;
    } catch (error) {
      console.error('Check MFA enabled error:', error);
      return false;
    }
  }
}

module.exports = new MFAService();
