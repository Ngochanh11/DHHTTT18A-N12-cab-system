const rateLimit = require('express-rate-limit');
const config = require('../config');
const dbConnection = require('../database/connection');

// Custom store for rate limiting using PostgreSQL
class PostgreSQLStore {
  constructor(options = {}) {
    this.tableName = options.tableName || 'rate_limit_store';
    this.prefix = options.prefix || 'rl:';
    this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
    this.createTableIfNotExists();
  }

  async createTableIfNotExists() {
    try {
      await dbConnection.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          key VARCHAR(255) PRIMARY KEY,
          hits INTEGER NOT NULL DEFAULT 0,
          reset_time TIMESTAMP NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_${this.tableName}_reset_time 
        ON ${this.tableName}(reset_time);
      `);
    } catch (error) {
      console.error('Failed to create rate limit table:', error);
    }
  }

  async increment(key) {
    const fullKey = this.prefix + key;
    const resetTime = new Date(Date.now() + this.windowMs);

    try {
      // Clean up expired entries
      await dbConnection.query(
        `DELETE FROM ${this.tableName} WHERE reset_time < NOW()`
      );

      // Try to increment existing entry
      const result = await dbConnection.query(
        `UPDATE ${this.tableName} 
         SET hits = hits + 1 
         WHERE key = $1 AND reset_time > NOW() 
         RETURNING hits, reset_time`,
        [fullKey]
      );

      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          totalHits: row.hits,
          resetTime: row.reset_time
        };
      }

      // Create new entry if doesn't exist
      await dbConnection.query(
        `INSERT INTO ${this.tableName} (key, hits, reset_time) 
         VALUES ($1, 1, $2)
         ON CONFLICT (key) DO UPDATE SET 
         hits = CASE 
           WHEN ${this.tableName}.reset_time < NOW() THEN 1 
           ELSE ${this.tableName}.hits + 1 
         END,
         reset_time = CASE 
           WHEN ${this.tableName}.reset_time < NOW() THEN $2 
           ELSE ${this.tableName}.reset_time 
         END`,
        [fullKey, resetTime]
      );

      return {
        totalHits: 1,
        resetTime: resetTime
      };

    } catch (error) {
      console.error('Rate limit store error:', error);
      // Return safe defaults if database fails
      return {
        totalHits: 1,
        resetTime: resetTime
      };
    }
  }

  async decrement(key) {
    const fullKey = this.prefix + key;
    
    try {
      await dbConnection.query(
        `UPDATE ${this.tableName} 
         SET hits = GREATEST(hits - 1, 0) 
         WHERE key = $1`,
        [fullKey]
      );
    } catch (error) {
      console.error('Rate limit decrement error:', error);
    }
  }

  async resetKey(key) {
    const fullKey = this.prefix + key;
    
    try {
      await dbConnection.query(
        `DELETE FROM ${this.tableName} WHERE key = $1`,
        [fullKey]
      );
    } catch (error) {
      console.error('Rate limit reset error:', error);
    }
  }
}

// Rate limiting configurations
const rateLimitConfigs = {
  // General API rate limiting
  general: {
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later',
        retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.ip + ':general';
    }
  },

  // Login rate limiting (stricter)
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: config.rateLimit.loginMax,
    message: {
      success: false,
      error: {
        code: 'LOGIN_RATE_LIMIT_EXCEEDED',
        message: 'Too many login attempts, please try again later',
        retryAfter: 15 * 60 // 15 minutes
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Rate limit by IP and identifier (email/phone)
      const identifier = req.body?.identifier || req.ip;
      return `${req.ip}:${identifier}:login`;
    },
    // Skip successful requests
    skipSuccessfulRequests: true
  },

  // OTP rate limiting (very strict)
  otp: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: config.rateLimit.otpMax,
    message: {
      success: false,
      error: {
        code: 'OTP_RATE_LIMIT_EXCEEDED',
        message: 'Too many OTP requests, please try again later',
        retryAfter: 5 * 60 // 5 minutes
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const phone = req.body?.phone || req.ip;
      return `${req.ip}:${phone}:otp`;
    },
    skipSuccessfulRequests: true
  },

  // Password reset rate limiting
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: {
      success: false,
      error: {
        code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
        message: 'Too many password reset requests, please try again later',
        retryAfter: 60 * 60 // 1 hour
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const email = req.body?.email || req.ip;
      return `${req.ip}:${email}:password_reset`;
    }
  },

  // Registration rate limiting
  registration: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: {
      success: false,
      error: {
        code: 'REGISTRATION_RATE_LIMIT_EXCEEDED',
        message: 'Too many registration attempts, please try again later',
        retryAfter: 60 * 60 // 1 hour
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.ip + ':registration';
    }
  }
};

// Create rate limiters
const rateLimiters = {};

// Initialize rate limiters with PostgreSQL store
Object.keys(rateLimitConfigs).forEach(key => {
  const config = rateLimitConfigs[key];
  
  rateLimiters[key] = rateLimit({
    ...config,
    store: new PostgreSQLStore({
      tableName: `rate_limit_${key}`,
      prefix: `rl:${key}:`,
      windowMs: config.windowMs
    }),
    handler: (req, res) => {
      // Log rate limit exceeded
      console.warn(`Rate limit exceeded for ${key}:`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        key: config.keyGenerator ? config.keyGenerator(req) : req.ip,
        timestamp: new Date().toISOString()
      });

      // Send rate limit response
      res.status(429).json({
        ...config.message,
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }
  });
});

// Advanced rate limiting for suspicious activity
class SuspiciousActivityDetector {
  static async checkSuspiciousActivity(req, res, next) {
    try {
      const ip = req.ip;
      const userAgent = req.get('User-Agent') || '';
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Check for suspicious patterns in the last hour
      const suspiciousChecks = await Promise.all([
        // Too many failed login attempts
        dbConnection.query(
          `SELECT COUNT(*) as count FROM audit_logs 
           WHERE ip_address = $1 AND action = 'LOGIN' AND success = false 
           AND created_at > $2`,
          [ip, oneHourAgo]
        ),
        
        // Too many different user agents from same IP
        dbConnection.query(
          `SELECT COUNT(DISTINCT user_agent) as count FROM audit_logs 
           WHERE ip_address = $1 AND created_at > $2`,
          [ip, oneHourAgo]
        ),
        
        // Too many different endpoints accessed
        dbConnection.query(
          `SELECT COUNT(DISTINCT resource) as count FROM audit_logs 
           WHERE ip_address = $1 AND created_at > $2`,
          [ip, oneHourAgo]
        )
      ]);

      const failedLogins = parseInt(suspiciousChecks[0].rows[0].count);
      const userAgents = parseInt(suspiciousChecks[1].rows[0].count);
      const endpoints = parseInt(suspiciousChecks[2].rows[0].count);

      // Define suspicious thresholds
      const isSuspicious = 
        failedLogins > 10 ||  // More than 10 failed logins
        userAgents > 5 ||     // More than 5 different user agents
        endpoints > 20;       // More than 20 different endpoints

      if (isSuspicious) {
        console.warn('Suspicious activity detected:', {
          ip,
          failedLogins,
          userAgents,
          endpoints,
          currentUserAgent: userAgent,
          timestamp: now.toISOString()
        });

        // Apply stricter rate limiting for suspicious IPs
        return res.status(429).json({
          success: false,
          error: {
            code: 'SUSPICIOUS_ACTIVITY_DETECTED',
            message: 'Suspicious activity detected. Access temporarily restricted.',
            retryAfter: 3600, // 1 hour
            timestamp: new Date().toISOString(),
            requestId: req.id
          }
        });
      }

      next();

    } catch (error) {
      console.error('Suspicious activity check error:', error);
      // Continue if check fails
      next();
    }
  }
}

// Middleware factory for custom rate limiting
function createCustomRateLimit(options) {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: options.message || {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later'
      }
    },
    keyGenerator: options.keyGenerator || ((req) => req.ip),
    store: new PostgreSQLStore({
      tableName: options.tableName || 'rate_limit_custom',
      prefix: options.prefix || 'rl:custom:',
      windowMs: options.windowMs || 15 * 60 * 1000
    }),
    standardHeaders: true,
    legacyHeaders: false
  });
}

module.exports = {
  rateLimiters,
  PostgreSQLStore,
  SuspiciousActivityDetector,
  createCustomRateLimit,
  
  // Export individual rate limiters for convenience
  generalRateLimit: rateLimiters.general,
  loginRateLimit: rateLimiters.login,
  otpRateLimit: rateLimiters.otp,
  passwordResetRateLimit: rateLimiters.passwordReset,
  registrationRateLimit: rateLimiters.registration
};