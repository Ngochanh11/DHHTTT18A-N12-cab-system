const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const dbConnection = require('../database/connection');

class OTPService {
  constructor() {
    this.otpLength = config.otp.length || 6;
    this.expiryMinutes = config.otp.expiryMinutes || 5;
    this.maxAttempts = 3;
  }

  /**
   * Generate OTP code
   * @param {string} phone - Phone number
   * @returns {Object} OTP data
   */
  async generateOTP(phone) {
    try {
      // Clean up expired OTPs first
      await this.cleanupExpiredOTPs();

      // Check if there's already an active OTP for this phone
      const existingOTP = await dbConnection.query(
        `SELECT id, attempts, expires_at 
         FROM otp_codes 
         WHERE phone = $1 AND verified = false AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1`,
        [phone]
      );

      // If there's an existing OTP that's still valid, return error
      if (existingOTP.rows.length > 0) {
        const timeLeft = Math.ceil((new Date(existingOTP.rows[0].expires_at) - new Date()) / 1000);
        throw new Error(`OTP_ALREADY_SENT: Please wait ${timeLeft} seconds before requesting a new OTP`);
      }

      // Generate new OTP code
      const code = this.generateRandomCode();
      const expiresAt = new Date(Date.now() + this.expiryMinutes * 60 * 1000);

      // Store OTP in database
      const result = await dbConnection.query(
        `INSERT INTO otp_codes (phone, code, expires_at) 
         VALUES ($1, $2, $3) 
         RETURNING id, code, expires_at`,
        [phone, code, expiresAt]
      );

      const otpData = result.rows[0];

      // Send OTP via SMS (mock implementation)
      await this.sendOTP(phone, code);

      console.log(`📱 OTP generated for ${phone}: ${code} (expires at ${expiresAt})`);

      return {
        id: otpData.id,
        phone,
        expiresAt: otpData.expires_at,
        message: 'OTP sent successfully'
      };

    } catch (error) {
      console.error('Generate OTP error:', error);
      
      if (error.message.startsWith('OTP_ALREADY_SENT')) {
        throw error;
      }
      
      throw new Error('OTP_GENERATION_FAILED');
    }
  }

  /**
   * Verify OTP code
   * @param {string} phone - Phone number
   * @param {string} code - OTP code
   * @returns {Object} Verification result
   */
  async verifyOTP(phone, code) {
    try {
      // Find the most recent OTP for this phone
      const result = await dbConnection.query(
        `SELECT id, code, attempts, expires_at, verified 
         FROM otp_codes 
         WHERE phone = $1 AND verified = false 
         ORDER BY created_at DESC LIMIT 1`,
        [phone]
      );

      if (result.rows.length === 0) {
        throw new Error('OTP_NOT_FOUND');
      }

      const otpData = result.rows[0];

      // Check if OTP has expired
      if (new Date() > new Date(otpData.expires_at)) {
        throw new Error('OTP_EXPIRED');
      }

      // Check if max attempts exceeded
      if (otpData.attempts >= this.maxAttempts) {
        throw new Error('OTP_MAX_ATTEMPTS_EXCEEDED');
      }

      // Increment attempt count
      await dbConnection.query(
        'UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1',
        [otpData.id]
      );

      // Verify code
      if (otpData.code !== code) {
        const remainingAttempts = this.maxAttempts - (otpData.attempts + 1);
        throw new Error(`OTP_INVALID: ${remainingAttempts} attempts remaining`);
      }

      // Mark OTP as verified
      await dbConnection.query(
        'UPDATE otp_codes SET verified = true WHERE id = $1',
        [otpData.id]
      );

      console.log(`✅ OTP verified successfully for ${phone}`);

      return {
        success: true,
        phone,
        message: 'OTP verified successfully'
      };

    } catch (error) {
      console.error('Verify OTP error:', error);
      
      if (['OTP_NOT_FOUND', 'OTP_EXPIRED', 'OTP_MAX_ATTEMPTS_EXCEEDED'].includes(error.message) || 
          error.message.startsWith('OTP_INVALID')) {
        throw error;
      }
      
      throw new Error('OTP_VERIFICATION_FAILED');
    }
  }

  /**
   * Send OTP via SMS (mock implementation)
   * @param {string} phone - Phone number
   * @param {string} code - OTP code
   * @returns {boolean} Success status
   */
  async sendOTP(phone, code) {
    try {
      if (config.sms.provider === 'mock') {
        // Mock SMS sending for development
        console.log(`📱 [MOCK SMS] Sending OTP to ${phone}: ${code}`);
        console.log(`📱 [MOCK SMS] Message: Your verification code is ${code}. Valid for ${this.expiryMinutes} minutes.`);
        return true;
      }

      // In production, integrate with real SMS provider
      // Example: Twilio, AWS SNS, etc.
      console.log(`📱 Sending OTP to ${phone} via ${config.sms.provider}`);
      
      // TODO: Implement real SMS sending
      // const smsResult = await smsProvider.send({
      //   to: phone,
      //   message: `Your verification code is ${code}. Valid for ${this.expiryMinutes} minutes.`
      // });

      return true;

    } catch (error) {
      console.error('Send OTP error:', error);
      throw new Error('SMS_SEND_FAILED');
    }
  }

  /**
   * Generate random OTP code
   * @returns {string} OTP code
   */
  generateRandomCode() {
    const min = Math.pow(10, this.otpLength - 1);
    const max = Math.pow(10, this.otpLength) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  /**
   * Clean up expired OTP codes
   * @returns {number} Number of cleaned OTPs
   */
  async cleanupExpiredOTPs() {
    try {
      const result = await dbConnection.query(
        'DELETE FROM otp_codes WHERE expires_at < NOW()'
      );

      if (result.rowCount > 0) {
        console.log(`🧹 Cleaned up ${result.rowCount} expired OTP codes`);
      }

      return result.rowCount;

    } catch (error) {
      console.error('Cleanup expired OTPs error:', error);
      return 0;
    }
  }

  /**
   * Get OTP statistics
   * @returns {Object} OTP statistics
   */
  async getOTPStats() {
    try {
      const result = await dbConnection.query(`
        SELECT 
          COUNT(*) as total_otps,
          COUNT(CASE WHEN verified = true THEN 1 END) as verified_otps,
          COUNT(CASE WHEN expires_at > NOW() AND verified = false THEN 1 END) as active_otps,
          COUNT(CASE WHEN expires_at < NOW() AND verified = false THEN 1 END) as expired_otps,
          AVG(attempts) as avg_attempts
        FROM otp_codes
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `);

      return result.rows[0];

    } catch (error) {
      console.error('Get OTP stats error:', error);
      throw new Error('OTP_STATS_FAILED');
    }
  }

  /**
   * Invalidate all OTPs for a phone number
   * @param {string} phone - Phone number
   * @returns {number} Number of invalidated OTPs
   */
  async invalidatePhoneOTPs(phone) {
    try {
      const result = await dbConnection.query(
        'UPDATE otp_codes SET verified = true WHERE phone = $1 AND verified = false',
        [phone]
      );

      console.log(`🚫 Invalidated ${result.rowCount} OTPs for ${phone}`);
      return result.rowCount;

    } catch (error) {
      console.error('Invalidate phone OTPs error:', error);
      throw new Error('OTP_INVALIDATION_FAILED');
    }
  }

  /**
   * Check if phone has too many recent OTP requests
   * @param {string} phone - Phone number
   * @returns {Object} Rate limit status
   */
  async checkOTPRateLimit(phone) {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const result = await dbConnection.query(
        `SELECT COUNT(*) as request_count 
         FROM otp_codes 
         WHERE phone = $1 AND created_at > $2`,
        [phone, oneHourAgo]
      );

      const requestCount = parseInt(result.rows[0].request_count);
      const maxRequestsPerHour = 5;

      return {
        allowed: requestCount < maxRequestsPerHour,
        requests: requestCount,
        maxRequests: maxRequestsPerHour,
        resetTime: new Date(Date.now() + 60 * 60 * 1000)
      };

    } catch (error) {
      console.error('OTP rate limit check error:', error);
      // Allow request if check fails
      return { allowed: true, requests: 0, maxRequests: 5 };
    }
  }
}

module.exports = new OTPService();