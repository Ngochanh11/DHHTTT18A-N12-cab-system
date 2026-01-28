# Auth Service

Microservice xác thực và ủy quyền cho hệ thống ride-sharing được xây dựng với Node.js, Express.js và PostgreSQL.

## Tính năng

- ✅ Đăng ký người dùng với email, phone, password
- ✅ Đăng nhập với email/phone và password  
- ✅ Xác thực OTP qua SMS
- ✅ JWT token management (access + refresh tokens)
- ✅ Rate limiting và bảo mật
- ✅ Role-based access control (customer, driver, admin)
- ✅ Audit logging
- ✅ Password reset (forgot/reset password)
- ✅ Multi-Factor Authentication (MFA/TOTP)

## 📚 Tài Liệu

- **[QUICK-TEST.md](./QUICK-TEST.md)** - Hướng dẫn test nhanh (3 bước)
- **[SETUP-DATABASE.md](./SETUP-DATABASE.md)** - Hướng dẫn setup database chi tiết
- **[TESTING-GUIDE.md](./TESTING-GUIDE.md)** - Hướng dẫn test tất cả endpoints

## Cài đặt

### 1. Cài đặt dependencies

```bash
cd services/auth-service
npm install
```

### 2. Setup Database

**Cách nhanh nhất (Docker):**
```bash
docker-compose up -d
```

**Hoặc sử dụng script:**
```bash
cp .env.example .env
# Chỉnh sửa .env với thông tin database
npm run setup-db
```

Xem chi tiết tại: [SETUP-DATABASE.md](./SETUP-DATABASE.md)

### 3. Cấu hình môi trường

Sao chép file `.env.example` thành `.env` và cập nhật các giá trị:

```bash
cp .env.example .env
```

### 3. Cài đặt PostgreSQL (cho production)

Tạo database và chạy migrations:

```bash
# Tạo database
createdb auth_service

# Chạy migrations
npm run migrate up
```

### 4. Chạy service

#### Demo Mode (không cần database)
```bash
node src/app-simple.js
```

#### Production Mode (cần PostgreSQL)
```bash
npm start
# hoặc
npm run dev
```

## API Endpoints

### Base URL
```
http://localhost:3001/api/v1
```

### Health Check
```http
GET /health
```

### Authentication

#### Đăng ký người dùng
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongPassword123!",
  "phone": "+84123456789",
  "role": "customer"
}
```

#### Đăng nhập
```http
POST /auth/login
Content-Type: application/json

{
  "identifier": "user@example.com",
  "password": "StrongPassword123!"
}
```

#### Đăng nhập OTP - Bước 1: Yêu cầu OTP
```http
POST /auth/login/otp
Content-Type: application/json

{
  "phone": "+84123456789"
}
```

#### Đăng nhập OTP - Bước 2: Xác thực OTP
```http
POST /auth/verify-otp
Content-Type: application/json

{
  "phone": "+84123456789",
  "otp": "123456"
}
```

#### Làm mới token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Đăng xuất
```http
POST /auth/logout
Authorization: Bearer your-access-token
```

#### Đăng xuất tất cả thiết bị
```http
POST /auth/logout/all
Authorization: Bearer your-access-token
```

### User Profile

#### Lấy thông tin profile
```http
GET /auth/me
Authorization: Bearer your-access-token
```

#### Kiểm tra token hợp lệ
```http
GET /auth/tokens/validate
Authorization: Bearer your-access-token
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  },
  "timestamp": "2026-01-24T13:55:52.968Z",
  "requestId": "uuid"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "timestamp": "2026-01-24T13:55:52.968Z",
    "requestId": "uuid"
  }
}
```

## Demo Mode

Trong demo mode, service chạy mà không cần database và sử dụng dữ liệu giả:

- OTP cố định: `123456`
- Tokens giả: `demo-access-token`, `demo-refresh-token`
- Tất cả operations đều thành công

## Production Setup

### Database Schema

Service sử dụng PostgreSQL với các bảng:
- `users` - Thông tin người dùng
- `refresh_tokens` - Refresh tokens
- `otp_codes` - Mã OTP
- `password_reset_tokens` - Tokens reset password
- `audit_logs` - Logs audit
- `rate_limit_*` - Rate limiting

### Environment Variables

```env
# Server
PORT=3001
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=auth_service
DB_USER=postgres
DB_PASSWORD=your-password

# JWT
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# SMS (production)
SMS_PROVIDER=twilio
SMS_API_KEY=your-api-key
SMS_API_SECRET=your-api-secret
```

### Security Features

- Helmet.js cho security headers
- CORS configuration
- Rate limiting (login: 5/15min, OTP: 3/5min, general: 100/15min)
- Password strength validation
- Input sanitization
- SQL injection prevention
- Audit logging
- Suspicious activity detection

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Docker

```bash
# Build image
docker build -t auth-service .

# Run container
docker run -p 3001:3001 auth-service
```

## Architecture

Service tuân theo Layered Architecture:

```
├── Controllers/     # HTTP request handlers
├── Services/        # Business logic
├── Middleware/      # Authentication, validation, rate limiting
├── Database/        # Database connection and migrations
├── Routes/          # API route definitions
├── Config/          # Configuration management
└── Utils/           # Utility functions
```

## Error Codes

| Code | Description |
|------|-------------|
| `EMAIL_EXISTS` | Email đã được đăng ký |
| `PHONE_EXISTS` | Số điện thoại đã được đăng ký |
| `WEAK_PASSWORD` | Mật khẩu không đủ mạnh |
| `INVALID_CREDENTIALS` | Email/phone hoặc mật khẩu không đúng |
| `ACCOUNT_DISABLED` | Tài khoản bị vô hiệu hóa |
| `TOKEN_EXPIRED` | Token đã hết hạn |
| `TOKEN_INVALID` | Token không hợp lệ |
| `OTP_EXPIRED` | OTP đã hết hạn |
| `OTP_INVALID` | OTP không đúng |
| `RATE_LIMIT_EXCEEDED` | Vượt quá giới hạn request |

## Monitoring

- Health check endpoint: `/api/v1/health`
- Request logging với Morgan
- Audit logs trong database
- Error tracking và reporting

## License

MIT License