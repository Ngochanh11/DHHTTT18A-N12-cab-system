const Joi = require('joi');

// Custom validation schemas
const schemas = {
  // User registration validation
  register: Joi.object({
    email: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'edu', 'gov', 'vn'] } })
      .required()
      .messages({
        'string.email': 'Email must be a valid email address',
        'any.required': 'Email is required'
      }),
    
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password must not exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required'
      }),
    
    phone: Joi.string()
      .pattern(new RegExp('^[+]?[1-9]\\d{1,14}$'))
      .required()
      .messages({
        'string.pattern.base': 'Phone number must be a valid international format',
        'any.required': 'Phone number is required'
      }),
    
    role: Joi.string()
      .valid('customer', 'driver', 'admin')
      .default('customer')
      .messages({
        'any.only': 'Role must be one of: customer, driver, admin'
      })
  }),

  // User login validation - accepts email or phone
  login: Joi.object({
    email: Joi.string()
      .email()
      .optional()
      .messages({
        'string.email': 'Email must be a valid email address'
      }),
    
    phone: Joi.string()
      .pattern(new RegExp('^[+]?[1-9]\\d{1,14}$'))
      .optional()
      .messages({
        'string.pattern.base': 'Phone number must be a valid international format'
      }),
    
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  }).or('email', 'phone').messages({
    'object.missing': 'Either email or phone is required'
  }),

  // OTP login validation
  loginOTP: Joi.object({
    phone: Joi.string()
      .pattern(new RegExp('^[+]?[1-9]\\d{1,14}$'))
      .required()
      .messages({
        'string.pattern.base': 'Phone number must be a valid international format',
        'any.required': 'Phone number is required'
      })
  }),

  // OTP verification validation
  verifyOTP: Joi.object({
    phone: Joi.string()
      .pattern(new RegExp('^[+]?[1-9]\\d{1,14}$'))
      .required()
      .messages({
        'string.pattern.base': 'Phone number must be a valid international format',
        'any.required': 'Phone number is required'
      }),
    
    otp: Joi.string()
      .length(6)
      .pattern(new RegExp('^\\d{6}$'))
      .required()
      .messages({
        'string.length': 'OTP must be exactly 6 digits',
        'string.pattern.base': 'OTP must contain only numbers',
        'any.required': 'OTP is required'
      })
  }),

  // Token refresh validation
  refresh: Joi.object({
    refreshToken: Joi.string()
      .required()
      .messages({
        'any.required': 'Refresh token is required'
      })
  }),

  // Password reset request validation
  forgotPassword: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Email must be a valid email address',
        'any.required': 'Email is required'
      })
  }),

  // Password reset validation
  resetPassword: Joi.object({
    token: Joi.string()
      .required()
      .messages({
        'any.required': 'Reset token is required'
      }),
    
    newPassword: Joi.string()
      .min(8)
      .max(128)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password must not exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'New password is required'
      })
  }),

  // MFA verification validation
  verifyMFA: Joi.object({
    token: Joi.string()
      .required()
      .messages({
        'any.required': 'MFA token is required'
      }),
    
    code: Joi.string()
      .length(6)
      .pattern(new RegExp('^\\d{6}$'))
      .required()
      .messages({
        'string.length': 'MFA code must be exactly 6 digits',
        'string.pattern.base': 'MFA code must contain only numbers',
        'any.required': 'MFA code is required'
      })
  }),

  // Admin token revocation validation
  revokeToken: Joi.object({
    userId: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.uuid': 'User ID must be a valid UUID',
        'any.required': 'User ID is required'
      }),
    
    tokenId: Joi.string()
      .uuid()
      .optional()
      .messages({
        'string.uuid': 'Token ID must be a valid UUID'
      })
  })
};

// Input sanitization function
function sanitizeInput(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Remove potential XSS and SQL injection patterns
      sanitized[key] = value
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .replace(/[<>]/g, ''); // Remove angle brackets
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => sanitizeInput(item));
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// Validation middleware factory
function validate(schemaName) {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'VALIDATION_SCHEMA_NOT_FOUND',
          message: 'Validation schema not found',
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    }

    // Sanitize input data
    const sanitizedBody = sanitizeInput(req.body);
    const sanitizedQuery = sanitizeInput(req.query);
    const sanitizedParams = sanitizeInput(req.params);

    // Validate request body
    const { error, value } = schema.validate(sanitizedBody, {
      abortEarly: false, // Return all validation errors
      stripUnknown: true, // Remove unknown fields
      convert: true // Convert types when possible
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: validationErrors,
          timestamp: new Date().toISOString(),
          requestId: req.id
        }
      });
    }

    // Replace request data with validated and sanitized data
    req.body = value;
    req.query = sanitizedQuery;
    req.params = sanitizedParams;

    next();
  };
}

// Custom validation functions
const customValidations = {
  // Check if email is already registered
  async isEmailUnique(email, excludeUserId = null) {
    const dbConnection = require('../database/connection');
    
    let query = 'SELECT id FROM users WHERE email = $1';
    let params = [email];
    
    if (excludeUserId) {
      query += ' AND id != $2';
      params.push(excludeUserId);
    }
    
    const result = await dbConnection.query(query, params);
    return result.rows.length === 0;
  },

  // Check if phone is already registered
  async isPhoneUnique(phone, excludeUserId = null) {
    const dbConnection = require('../database/connection');
    
    let query = 'SELECT id FROM users WHERE phone = $1';
    let params = [phone];
    
    if (excludeUserId) {
      query += ' AND id != $2';
      params.push(excludeUserId);
    }
    
    const result = await dbConnection.query(query, params);
    return result.rows.length === 0;
  },

  // Validate password strength
  validatePasswordStrength(password) {
    const minLength = 8;
    const maxLength = 128;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);
    
    const errors = [];
    
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    
    if (password.length > maxLength) {
      errors.push(`Password must not exceed ${maxLength} characters`);
    }
    
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }
    
    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

module.exports = {
  validate,
  schemas,
  sanitizeInput,
  customValidations
};