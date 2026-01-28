const validator = require('validator');
const config = require('../config');

/**
 * Validation middleware for request validation
 */

/**
 * Validate notification creation request
 */
const validateNotificationCreate = (req, res, next) => {
  const { userId, type, title, body, data, channels } = req.body;
  const errors = [];

  if (!userId || typeof userId !== 'string') {
    errors.push('userId must be a non-empty string');
  }

  if (!type || !config.notificationTypes.includes(type)) {
    errors.push(`type must be one of: ${config.notificationTypes.join(', ')}`);
  }

  if (!title || typeof title !== 'string') {
    errors.push('title must be a non-empty string');
  } else if (title.length > 255) {
    errors.push('title must be at most 255 characters');
  }

  if (!body || typeof body !== 'string') {
    errors.push('body must be a non-empty string');
  } else if (body.length > 1000) {
    errors.push('body must be at most 1000 characters');
  }

  if (channels) {
    if (!Array.isArray(channels)) {
      errors.push('channels must be an array');
    } else {
      const validChannels = Object.values(config.channels);
      const invalidChannels = channels.filter(c => !validChannels.includes(c));
      if (invalidChannels.length > 0) {
        errors.push(`channels must be one of: ${validChannels.join(', ')}`);
      }
    }
  }

  if (data && typeof data !== 'object') {
    errors.push('data must be an object');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors,
        timestamp: new Date().toISOString()
      }
    });
  }

  next();
};

/**
 * Validate pagination query parameters
 */
const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;
  const errors = [];

  if (page !== undefined) {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push('page must be a positive integer');
    }
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 1) {
      errors.push('limit must be a positive integer');
    } else if (limitNum > config.pagination.maxLimit) {
      errors.push(`limit must not exceed ${config.pagination.maxLimit}`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Set defaults
  req.query.page = parseInt(page, 10) || 1;
  req.query.limit = parseInt(limit, 10) || config.pagination.defaultLimit;

  next();
};

/**
 * Validate notification ID parameter
 */
const validateNotificationId = (req, res, next) => {
  const { notificationId } = req.params;

  if (!notificationId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'notificationId is required',
        timestamp: new Date().toISOString()
      }
    });
  }

  // Basic MongoDB ObjectId validation (24 hex characters)
  if (!/^[a-fA-F0-9]{24}$/.test(notificationId)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid notification ID format',
        timestamp: new Date().toISOString()
      }
    });
  }

  next();
};

/**
 * Validate preferences update request
 */
const validatePreferencesUpdate = (req, res, next) => {
  const { channels, notifications, quietHours, language } = req.body;
  const errors = [];

  if (channels) {
    if (channels.push !== undefined && typeof channels.push !== 'object') {
      errors.push('channels.push must be an object');
    }
    if (channels.sms !== undefined && typeof channels.sms !== 'object') {
      errors.push('channels.sms must be an object');
    }
    if (channels.email !== undefined && typeof channels.email !== 'object') {
      errors.push('channels.email must be an object');
    }
  }

  if (notifications) {
    if (typeof notifications !== 'object') {
      errors.push('notifications must be an object');
    }
  }

  if (quietHours) {
    if (quietHours.enabled !== undefined && typeof quietHours.enabled !== 'boolean') {
      errors.push('quietHours.enabled must be a boolean');
    }
    if (quietHours.startTime !== undefined && !/^\d{2}:\d{2}$/.test(quietHours.startTime)) {
      errors.push('quietHours.startTime must be in HH:MM format');
    }
    if (quietHours.endTime !== undefined && !/^\d{2}:\d{2}$/.test(quietHours.endTime)) {
      errors.push('quietHours.endTime must be in HH:MM format');
    }
    if (quietHours.timezone !== undefined && typeof quietHours.timezone !== 'string') {
      errors.push('quietHours.timezone must be a string');
    }
  }

  if (language && !['vi', 'en'].includes(language)) {
    errors.push('language must be one of: vi, en');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors,
        timestamp: new Date().toISOString()
      }
    });
  }

  next();
};

/**
 * Validate unreadOnly query parameter
 */
const validateUnreadOnly = (req, res, next) => {
  const { unreadOnly } = req.query;

  if (unreadOnly !== undefined) {
    if (unreadOnly === 'true' || unreadOnly === '1') {
      req.query.unreadOnly = true;
    } else if (unreadOnly === 'false' || unreadOnly === '0') {
      req.query.unreadOnly = false;
    } else {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'unreadOnly must be a boolean (true/false)',
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  next();
};

module.exports = {
  validateNotificationCreate,
  validatePagination,
  validateNotificationId,
  validatePreferencesUpdate,
  validateUnreadOnly
};

