const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');

const config = require('./config');
// const dbConnection = require('./database/connection');
// const routes = require('./routes');
// const { generalRateLimit, SuspiciousActivityDetector } = require('./middleware/rateLimit');

// Mock data storage (in memory)
const mockUsers = new Map();
const mockTokens = new Map();
const mockOTPs = new Map();
const mockResetTokens = new Map();

// Mock JWT tokens
const generateMockToken = () => `mock_token_${uuidv4().replace(/-/g, '')}`;

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
}));

// Request logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Request ID middleware
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_TOKEN',
        message: 'Access token is required'
      }
    });
  }

  const token = authHeader.substring(7);
  const tokenData = mockTokens.get(token);

  if (!tokenData || tokenData.type !== 'access') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid access token'
      }
    });
  }

  if (Date.now() > tokenData.expiresAt) {
    mockTokens.delete(token);
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Access token has expired'
      }
    });
  }

  req.userId = tokenData.userId;
  next();
};

// 1. POST /register - Đăng ký tài khoản mới
app.post('/api/v1/auth/register', (req, res) => {
  const { email, password, phone, role } = req.body;

  if (!email || !password || !phone) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email, password, and phone are required'
      }
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Password must be at least 8 characters long'
      }
    });
  }

  if (mockUsers.has(email)) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'USER_EXISTS',
        message: 'User with this email already exists'
      }
    });
  }

  const userId = uuidv4();
  const user = {
    id: userId,
    email,
    phone,
    role: role || 'customer',
    isVerified: false,
    createdAt: new Date().toISOString()
  };

  mockUsers.set(email, user);

  const accessToken = generateMockToken();
  const refreshToken = generateMockToken();

  mockTokens.set(accessToken, { userId, type: 'access', expiresAt: Date.now() + 15 * 60 * 1000 });
  mockTokens.set(refreshToken, { userId, type: 'refresh', expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      accessToken,
      refreshToken,
      expiresIn: 900,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    }
  });
});

// 2. POST /login - Đăng nhập
app.post('/api/v1/auth/login', (req, res) => {
  const { identifier, password, email, phone } = req.body;
  const loginId = identifier || email || phone;

  if (!loginId || !password) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email/phone and password are required'
      }
    });
  }

  let user = null;
  for (const [userEmail, userData] of mockUsers) {
    if (userEmail === loginId || userData.phone === loginId) {
      user = userData;
      break;
    }
  }

  if (!user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email/phone or password'
      }
    });
  }

  const accessToken = generateMockToken();
  const refreshToken = generateMockToken();

  mockTokens.set(accessToken, { userId: user.id, type: 'access', expiresAt: Date.now() + 15 * 60 * 1000 });
  mockTokens.set(refreshToken, { userId: user.id, type: 'refresh', expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      accessToken,
      refreshToken,
      expiresIn: 900,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    }
  });
});

// 3. POST /login/otp - Đăng nhập bằng OTP
app.post('/api/v1/auth/login/otp', (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Phone number is required'
      }
    });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpId = uuidv4();

  mockOTPs.set(phone, {
    id: otpId,
    code: otp,
    phone,
    expiresAt: Date.now() + 5 * 60 * 1000,
    attempts: 0
  });

  console.log(`📱 [MOCK SMS] OTP for ${phone}: ${otp}`);

  res.json({
    success: true,
    message: 'OTP sent successfully',
    data: {
      phone,
      expiresIn: 300
    }
  });
});

// 4. POST /verify-otp - Xác thực OTP
app.post('/api/v1/auth/verify-otp', (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Phone and OTP are required'
      }
    });
  }

  const otpData = mockOTPs.get(phone);
  if (!otpData) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'OTP_NOT_FOUND',
        message: 'No OTP found for this phone number'
      }
    });
  }

  if (Date.now() > otpData.expiresAt) {
    mockOTPs.delete(phone);
    return res.status(400).json({
      success: false,
      error: {
        code: 'OTP_EXPIRED',
        message: 'OTP has expired'
      }
    });
  }

  if (otpData.code !== otp) {
    otpData.attempts++;
    if (otpData.attempts >= 3) {
      mockOTPs.delete(phone);
      return res.status(400).json({
        success: false,
        error: {
          code: 'OTP_MAX_ATTEMPTS_EXCEEDED',
          message: 'Maximum OTP attempts exceeded'
        }
      });
    }
    return res.status(400).json({
      success: false,
      error: {
        code: 'OTP_INVALID',
        message: `Invalid OTP. ${3 - otpData.attempts} attempts remaining`
      }
    });
  }

  mockOTPs.delete(phone);

  const accessToken = generateMockToken();
  const refreshToken = generateMockToken();
  const userId = uuidv4();

  mockTokens.set(accessToken, { userId, type: 'access', expiresAt: Date.now() + 15 * 60 * 1000 });
  mockTokens.set(refreshToken, { userId, type: 'refresh', expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });

  res.json({
    success: true,
    message: 'OTP verified successfully',
    data: {
      accessToken,
      refreshToken,
      expiresIn: 900,
      tokenType: 'Bearer',
      user: {
        id: userId,
        phone,
        role: 'customer',
        isVerified: true
      }
    }
  });
});

// 5. POST /refresh - Làm mới access token
app.post('/api/v1/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Refresh token is required'
      }
    });
  }

  const tokenData = mockTokens.get(refreshToken);
  if (!tokenData || tokenData.type !== 'refresh') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid refresh token'
      }
    });
  }

  if (Date.now() > tokenData.expiresAt) {
    mockTokens.delete(refreshToken);
    return res.status(401).json({
      success: false,
      error: {
        code: 'REFRESH_TOKEN_EXPIRED',
        message: 'Refresh token has expired'
      }
    });
  }

  const newAccessToken = generateMockToken();
  const newRefreshToken = generateMockToken();

  mockTokens.set(newAccessToken, { userId: tokenData.userId, type: 'access', expiresAt: Date.now() + 15 * 60 * 1000 });
  mockTokens.set(newRefreshToken, { userId: tokenData.userId, type: 'refresh', expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });

  mockTokens.delete(refreshToken);

  res.json({
    success: true,
    message: 'Tokens refreshed successfully',
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
      tokenType: 'Bearer'
    }
  });
});

// 6. GET /me - Lấy thông tin user hiện tại
app.get('/api/v1/auth/me', verifyToken, (req, res) => {
  let user = null;
  for (const userData of mockUsers.values()) {
    if (userData.id === req.userId) {
      user = userData;
      break;
    }
  }

  if (!user) {
    user = {
      id: req.userId,
      email: 'mock@example.com',
      phone: '+84123456789',
      role: 'customer',
      isVerified: true,
      createdAt: new Date().toISOString()
    };
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    }
  });
});

// 7. GET /tokens/validate - Kiểm tra token hợp lệ
app.get('/api/v1/auth/tokens/validate', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      userId: req.userId,
      valid: true
    }
  });
});

// 8. POST /logout - Đăng xuất
app.post('/api/v1/auth/logout', verifyToken, (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader.substring(7);
  
  mockTokens.delete(token);

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// 9. POST /logout/all - Đăng xuất tất cả thiết bị
app.post('/api/v1/auth/logout/all', verifyToken, (req, res) => {
  let removedCount = 0;
  for (const [token, tokenData] of mockTokens) {
    if (tokenData.userId === req.userId) {
      mockTokens.delete(token);
      removedCount++;
    }
  }

  res.json({
    success: true,
    message: 'Logged out from all devices',
    data: {
      tokensRevoked: removedCount
    }
  });
});

// 10. POST /password/forgot - Quên mật khẩu
app.post('/api/v1/auth/password/forgot', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email is required'
      }
    });
  }

  const resetToken = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  const tokenId = uuidv4();

  mockResetTokens.set(resetToken, {
    id: tokenId,
    email,
    expiresAt: Date.now() + 60 * 60 * 1000
  });

  console.log(`📧 [MOCK EMAIL] Reset token for ${email}: ${resetToken}`);

  res.json({
    success: true,
    message: 'Password reset email sent'
  });
});

// 11. POST /password/reset - Đặt lại mật khẩu
app.post('/api/v1/auth/password/reset', (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Token and new password are required'
      }
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Password must be at least 8 characters long'
      }
    });
  }

  const resetData = mockResetTokens.get(token);
  if (!resetData) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_RESET_TOKEN',
        message: 'Invalid or expired reset token'
      }
    });
  }

  if (Date.now() > resetData.expiresAt) {
    mockResetTokens.delete(token);
    return res.status(400).json({
      success: false,
      error: {
        code: 'RESET_TOKEN_EXPIRED',
        message: 'Reset token has expired'
      }
    });
  }

  mockResetTokens.delete(token);

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
});

// 12. POST /mfa/enable - Kích hoạt MFA
app.post('/api/v1/auth/mfa/enable', verifyToken, (req, res) => {
  const secret = 'JBSWY3DPEHPK3PXP';
  const otpauthUrl = `otpauth://totp/RideShare:mock@example.com?secret=${secret}&issuer=RideShare`;

  res.json({
    success: true,
    message: 'MFA enabled successfully',
    data: {
      secret,
      otpauthUrl,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`
    }
  });
});

// 13. POST /mfa/verify - Xác thực MFA
app.post('/api/v1/auth/mfa/verify', (req, res) => {
  const { token, code } = req.body;

  if (!token || !code) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Token and MFA code are required'
      }
    });
  }

  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_MFA_CODE',
        message: 'MFA code must be 6 digits'
      }
    });
  }

  const accessToken = generateMockToken();
  const refreshToken = generateMockToken();
  const userId = uuidv4();

  mockTokens.set(accessToken, { userId, type: 'access', expiresAt: Date.now() + 15 * 60 * 1000 });
  mockTokens.set(refreshToken, { userId, type: 'refresh', expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });

  res.json({
    success: true,
    message: 'MFA verification successful',
    data: {
      accessToken,
      refreshToken,
      expiresIn: 900,
      tokenType: 'Bearer',
      user: {
        id: userId,
        email: 'admin@rideshare.com',
        role: 'admin',
        isVerified: true,
        mfaEnabled: true
      }
    }
  });
});

// 14. POST /tokens/revoke - Thu hồi token
app.post('/api/v1/auth/tokens/revoke', verifyToken, (req, res) => {
  const { userId, tokenId } = req.body;

  if (!userId && !tokenId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Either userId or tokenId is required'
      }
    });
  }

  let revokedCount = 0;
  
  if (tokenId) {
    if (mockTokens.delete(tokenId)) {
      revokedCount = 1;
    }
  } else if (userId) {
    for (const [token, tokenData] of mockTokens) {
      if (tokenData.userId === userId) {
        mockTokens.delete(token);
        revokedCount++;
      }
    }
  }

  res.json({
    success: true,
    message: 'Tokens revoked successfully',
    data: {
      tokensRevoked: revokedCount
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Auth Service Mock API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);

  // Don't leak error details in production
  const isDevelopment = config.nodeEnv === 'development';

  res.status(error.status || 500).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
      ...(isDevelopment && { stack: error.stack }),
      timestamp: new Date().toISOString(),
      requestId: req.id
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
      timestamp: new Date().toISOString(),
      requestId: req.id
    }
  });
});

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Start HTTP server
    const server = app.listen(config.port, () => {
      console.log(`🚀 Mock Auth Service running on port ${config.port}`);
      console.log(`📱 Health check: http://localhost:${config.port}/`);
      console.log(`🔧 Mode: MOCK (No database required)`);
      console.log(`📋 All 14 endpoints available for testing`);
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      process.exit(1);
    });

    return server;

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
