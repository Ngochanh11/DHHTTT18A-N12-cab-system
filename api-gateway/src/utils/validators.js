/**
 * Validation utilities for API Gateway
 */

const validators = {
  /**
   * Validate email format
   */
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate JWT token format
   */
  isValidToken: (token) => {
    if (!token) return false;
    const parts = token.split('.');
    return parts.length === 3;
  },

  /**
   * Validate location coordinates
   */
  isValidLocation: (latitude, longitude) => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  },

  /**
   * Validate phone number (basic)
   */
  isValidPhone: (phone) => {
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone);
  },

  /**
   * Validate pagination parameters
   */
  validatePagination: (page, limit) => {
    const p = parseInt(page) || 1;
    const l = parseInt(limit) || 10;
    
    if (p < 1) return { valid: false, error: 'Page must be >= 1' };
    if (l < 1 || l > 100) return { valid: false, error: 'Limit must be between 1 and 100' };
    
    return { valid: true, page: p, limit: l };
  }
};

module.exports = validators;
