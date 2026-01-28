const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const dbConnection = require('../database/connection');
const { customValidations } = require('../middleware/validation');

class UserService {
  constructor() {
    this.saltRounds = 12; // High salt rounds for security
  }

  /**
   * Create a new user
   * @param {Object} userData - User registration data
   * @returns {Object} Created user (without password)
   */
  async createUser(userData) {
    const { email, password, phone, role = 'customer' } = userData;

    try {
      // Validate email uniqueness
      const isEmailUnique = await customValidations.isEmailUnique(email);
      if (!isEmailUnique) {
        throw new Error('EMAIL_EXISTS');
      }

      // Validate phone uniqueness if provided
      if (phone) {
        const isPhoneUnique = await customValidations.isPhoneUnique(phone);
        if (!isPhoneUnique) {
          throw new Error('PHONE_EXISTS');
        }
      }

      // Validate password strength
      const passwordValidation = customValidations.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw new Error(`WEAK_PASSWORD: ${passwordValidation.errors.join(', ')}`);
      }

      // Hash password
      const passwordHash = await this.hashPassword(password);

      // Create user in database
      const result = await dbConnection.query(
        `INSERT INTO users (email, password_hash, phone, role, is_active, is_verified) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id, email, phone, role, is_active, is_verified, created_at`,
        [email, passwordHash, phone, role, true, false]
      );

      const user = result.rows[0];

      console.log(`✅ User created successfully: ${user.email} (${user.role})`);

      return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.is_active,
        isVerified: user.is_verified,
        createdAt: user.created_at
      };

    } catch (error) {
      console.error('User creation error:', error);
      
      if (error.message.startsWith('EMAIL_EXISTS')) {
        throw new Error('EMAIL_EXISTS');
      }
      if (error.message.startsWith('PHONE_EXISTS')) {
        throw new Error('PHONE_EXISTS');
      }
      if (error.message.startsWith('WEAK_PASSWORD')) {
        throw new Error(error.message);
      }
      
      throw new Error('USER_CREATION_FAILED');
    }
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Object|null} User object or null if not found
   */
  async findUserByEmail(email) {
    try {
      const result = await dbConnection.query(
        `SELECT id, email, phone, password_hash, role, is_active, is_verified, 
                mfa_enabled, mfa_secret, created_at, updated_at, last_login
         FROM users WHERE email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        passwordHash: user.password_hash,
        role: user.role,
        isActive: user.is_active,
        isVerified: user.is_verified,
        mfaEnabled: user.mfa_enabled,
        mfaSecret: user.mfa_secret,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLogin: user.last_login
      };

    } catch (error) {
      console.error('Find user by email error:', error);
      throw new Error('USER_LOOKUP_FAILED');
    }
  }

  /**
   * Find user by phone
   * @param {string} phone - User phone number
   * @returns {Object|null} User object or null if not found
   */
  async findUserByPhone(phone) {
    try {
      const result = await dbConnection.query(
        `SELECT id, email, phone, password_hash, role, is_active, is_verified, 
                mfa_enabled, mfa_secret, created_at, updated_at, last_login
         FROM users WHERE phone = $1`,
        [phone]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        passwordHash: user.password_hash,
        role: user.role,
        isActive: user.is_active,
        isVerified: user.is_verified,
        mfaEnabled: user.mfa_enabled,
        mfaSecret: user.mfa_secret,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLogin: user.last_login
      };

    } catch (error) {
      console.error('Find user by phone error:', error);
      throw new Error('USER_LOOKUP_FAILED');
    }
  }

  /**
   * Find user by ID
   * @param {string} userId - User ID
   * @returns {Object|null} User object or null if not found
   */
  async findUserById(userId) {
    try {
      const result = await dbConnection.query(
        `SELECT id, email, phone, role, is_active, is_verified, 
                mfa_enabled, mfa_secret, created_at, updated_at, last_login
         FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.is_active,
        isVerified: user.is_verified,
        mfaEnabled: user.mfa_enabled,
        mfaSecret: user.mfa_secret,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLogin: user.last_login
      };

    } catch (error) {
      console.error('Find user by ID error:', error);
      throw new Error('USER_LOOKUP_FAILED');
    }
  }

  /**
   * Find user by email or phone
   * @param {string} identifier - Email or phone number
   * @returns {Object|null} User object or null if not found
   */
  async findUserByIdentifier(identifier) {
    try {
      // Check if identifier looks like an email
      const isEmail = identifier.includes('@');
      
      if (isEmail) {
        return await this.findUserByEmail(identifier);
      } else {
        return await this.findUserByPhone(identifier);
      }

    } catch (error) {
      console.error('Find user by identifier error:', error);
      throw new Error('USER_LOOKUP_FAILED');
    }
  }

  /**
   * Update user information
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated user
   */
  async updateUser(userId, updateData) {
    try {
      const allowedFields = ['email', 'phone', 'role', 'is_active', 'is_verified', 'mfa_enabled', 'mfa_secret'];
      const updates = [];
      const values = [];
      let paramIndex = 1;

      // Build dynamic update query
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          updates.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      if (updates.length === 0) {
        throw new Error('NO_VALID_UPDATES');
      }

      // Add updated_at timestamp
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(userId);

      const query = `
        UPDATE users 
        SET ${updates.join(', ')} 
        WHERE id = $${paramIndex} 
        RETURNING id, email, phone, role, is_active, is_verified, mfa_enabled, updated_at
      `;

      const result = await dbConnection.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('USER_NOT_FOUND');
      }

      const user = result.rows[0];
      console.log(`✅ User updated successfully: ${user.email}`);

      return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.is_active,
        isVerified: user.is_verified,
        mfaEnabled: user.mfa_enabled,
        updatedAt: user.updated_at
      };

    } catch (error) {
      console.error('User update error:', error);
      
      if (error.message === 'USER_NOT_FOUND' || error.message === 'NO_VALID_UPDATES') {
        throw error;
      }
      
      throw new Error('USER_UPDATE_FAILED');
    }
  }

  /**
   * Update user password
   * @param {string} userId - User ID
   * @param {string} newPassword - New password
   * @returns {boolean} Success status
   */
  async updatePassword(userId, newPassword) {
    try {
      // Validate password strength
      const passwordValidation = customValidations.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(`WEAK_PASSWORD: ${passwordValidation.errors.join(', ')}`);
      }

      // Hash new password
      const passwordHash = await this.hashPassword(newPassword);

      // Update password in database
      const result = await dbConnection.query(
        `UPDATE users 
         SET password_hash = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING id, email`,
        [passwordHash, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('USER_NOT_FOUND');
      }

      console.log(`✅ Password updated for user: ${result.rows[0].email}`);
      return true;

    } catch (error) {
      console.error('Password update error:', error);
      
      if (error.message === 'USER_NOT_FOUND' || error.message.startsWith('WEAK_PASSWORD')) {
        throw error;
      }
      
      throw new Error('PASSWORD_UPDATE_FAILED');
    }
  }

  /**
   * Update last login timestamp
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  async updateLastLogin(userId) {
    try {
      await dbConnection.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );
      
      return true;

    } catch (error) {
      console.error('Update last login error:', error);
      // Don't throw error for this non-critical operation
      return false;
    }
  }

  /**
   * Hash password using bcrypt
   * @param {string} password - Plain text password
   * @returns {string} Hashed password
   */
  async hashPassword(password) {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      console.error('Password hashing error:', error);
      throw new Error('PASSWORD_HASH_FAILED');
    }
  }

  /**
   * Validate password against hash
   * @param {string} password - Plain text password
   * @param {string} hashedPassword - Hashed password from database
   * @returns {boolean} Validation result
   */
  async validatePassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('Password validation error:', error);
      return false;
    }
  }

  /**
   * Deactivate user account
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  async deactivateUser(userId) {
    try {
      const result = await dbConnection.query(
        `UPDATE users 
         SET is_active = false, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 
         RETURNING email`,
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('USER_NOT_FOUND');
      }

      console.log(`✅ User deactivated: ${result.rows[0].email}`);
      return true;

    } catch (error) {
      console.error('User deactivation error:', error);
      
      if (error.message === 'USER_NOT_FOUND') {
        throw error;
      }
      
      throw new Error('USER_DEACTIVATION_FAILED');
    }
  }

  /**
   * Activate user account
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  async activateUser(userId) {
    try {
      const result = await dbConnection.query(
        `UPDATE users 
         SET is_active = true, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 
         RETURNING email`,
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('USER_NOT_FOUND');
      }

      console.log(`✅ User activated: ${result.rows[0].email}`);
      return true;

    } catch (error) {
      console.error('User activation error:', error);
      
      if (error.message === 'USER_NOT_FOUND') {
        throw error;
      }
      
      throw new Error('USER_ACTIVATION_FAILED');
    }
  }

  /**
   * Verify user account
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  async verifyUser(userId) {
    try {
      const result = await dbConnection.query(
        `UPDATE users 
         SET is_verified = true, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 
         RETURNING email`,
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('USER_NOT_FOUND');
      }

      console.log(`✅ User verified: ${result.rows[0].email}`);
      return true;

    } catch (error) {
      console.error('User verification error:', error);
      
      if (error.message === 'USER_NOT_FOUND') {
        throw error;
      }
      
      throw new Error('USER_VERIFICATION_FAILED');
    }
  }

  /**
   * Get user statistics
   * @returns {Object} User statistics
   */
  async getUserStats() {
    try {
      const result = await dbConnection.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
          COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_users,
          COUNT(CASE WHEN role = 'customer' THEN 1 END) as customers,
          COUNT(CASE WHEN role = 'driver' THEN 1 END) as drivers,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
          COUNT(CASE WHEN mfa_enabled = true THEN 1 END) as mfa_enabled_users
        FROM users
      `);

      return result.rows[0];

    } catch (error) {
      console.error('Get user stats error:', error);
      throw new Error('USER_STATS_FAILED');
    }
  }
}

module.exports = new UserService();