# API Gateway - Hệ Thống Gọi Xe CAB

## Tổng Quan

API Gateway là điểm vào chính cho tất cả các yêu cầu từ client trong Hệ Thống Gọi Xe CAB. Nó xử lý:
- Định tuyến yêu cầu đến các microservices
- Xác thực & Phân quyền
- Giới hạn tốc độ
- Ghi log yêu cầu/Phản hồi
- Xử lý lỗi
- WebSocket proxy cho các cập nhật thời gian thực

## Kiến Trúc

```
Yêu Cầu từ Client
     ↓
  API Gateway (Cổng 3000)
     ↓
   ├─ Auth Service (3001)
   ├─ User Service (3002)
   ├─ Driver Service (3003)
   ├─ Booking Service (3004)
   ├─ Ride Service (3005)
   ├─ Payment Service (3007)
   ├─ Pricing Service (3008)
   ├─ Notification Service (3009)
   └─ Review Service (3010)
```

## Biến Môi Trường

```env
PORT=3000
NODE_ENV=development

# URLs Service
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
DRIVER_SERVICE_URL=http://localhost:3003
BOOKING_SERVICE_URL=http://localhost:3004
RIDE_SERVICE_URL=http://localhost:3005
PAYMENT_SERVICE_URL=http://localhost:3007
PRICING_SERVICE_URL=http://localhost:3008
NOTIFICATION_SERVICE_URL=http://localhost:3009
REVIEW_SERVICE_URL=http://localhost:3010

# Cấu Hình WebSocket
RIDE_WS_URL=http://localhost:3006

# Cấu Hình JWT
JWT_SECRET=your-secret-key

# Giới Hạn Tốc Độ
RATE_LIMIT_WINDOW_MS=900000    # 15 phút
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=*

# Ghi Log
LOG_LEVEL=debug
```

## Chạy Gateway

### Chế Độ Phát Triển
```bash
npm install
npm run dev
```

### Chế Độ Production
```bash
npm install
npm start
```

## Tài Liệu API

### Health Check
```http
GET /health
GET /api/v1/health
```

### Swagger UI
```
http://localhost:3000/api/v1/docs
http://localhost:3000/api/v1/swagger
```

### Thông Số Kỹ Thuật OpenAPI
```
http://localhost:3000/api/v1/openapi.json
```

## Các Route Có Sẵn

### Auth Service
- `POST /api/v1/auth/login` - Đăng nhập người dùng
- `POST /api/v1/auth/register` - Đăng ký người dùng
- `POST /api/v1/auth/refresh` - Làm mới token

### User Service
- `GET /api/v1/users` - Lấy danh sách người dùng (yêu cầu xác thực)
- `GET /api/v1/users/:id` - Lấy thông tin người dùng theo ID
- `PUT /api/v1/users/:id` - Cập nhật người dùng
- `DELETE /api/v1/users/:id` - Xóa người dùng

### Driver Service
- `GET /api/v1/drivers` - Lấy danh sách tài xế có sẵn
- `GET /api/v1/drivers/:id` - Lấy chi tiết tài xế
- `PUT /api/v1/drivers/:id` - Cập nhật tài xế

### Booking Service
- `GET /api/v1/bookings` - Lấy danh sách đặt xe
- `POST /api/v1/bookings` - Tạo đặt xe mới
- `GET /api/v1/bookings/:id` - Lấy chi tiết đặt xe
- `PATCH /api/v1/bookings/:id` - Cập nhật trạng thái đặt xe

### Ride Service
- `GET /api/v1/rides` - Lấy danh sách chuyến đi
- `GET /api/v1/rides/:id` - Lấy chi tiết chuyến đi
- `PATCH /api/v1/rides/:id/status` - Cập nhật trạng thái chuyến đi

### Payment Service
- `POST /api/v1/payments` - Tạo thanh toán
- `GET /api/v1/payments/:id` - Lấy chi tiết thanh toán

### Pricing Service
- `GET /api/v1/pricings` - Lấy bảng giá
- `POST /api/v1/pricings/estimate` - Ước tính giá cước

### Notifications
- `GET /api/v1/notifications` - Lấy danh sách thông báo
- `POST /api/v1/notifications/read/:id` - Đánh dấu thông báo đã đọc

### Reviews
- `GET /api/v1/reviews` - Lấy danh sách đánh giá
- `POST /api/v1/reviews` - Tạo đánh giá

## WebSocket Connections

### Cập Nhật GPS Chuyến Đi
```
ws://localhost:3000/ws/ride
```

Kết nối để nhận các cập nhật vị trí tài xế thời gian thực và thay đổi trạng thái chuyến đi.

## Xử Lý Lỗi

Tất cả các lỗi tuân theo định dạng nhất quán:

```json
{
  "error": "Loại Lỗi",
  "message": "Thông báo lỗi dễ hiểu",
  "timestamp": "2024-01-27T10:30:00Z",
  "service": "tên-service"
}
```

### Mã Trạng Thái Thường Gặp
- `200` - OK
- `201` - Tạo mới
- `400` - Yêu cầu không hợp lệ
- `401` - Không được phép (token thiếu/không hợp lệ)
- `403` - Cấm truy cập (quyền không đủ)
- `404` - Không tìm thấy
- `429` - Quá nhiều yêu cầu (bị giới hạn tốc độ)
- `500` - Lỗi máy chủ nội bộ
- `503` - Dịch vụ không khả dụng

## Giới Hạn Tốc Độ

Theo mặc định:
- 100 yêu cầu trên 15 phút mỗi IP
- Các endpoint health check bỏ qua giới hạn tốc độ

Phản hồi bao gồm các header giới hạn tốc độ:
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1706347800
```

## Request Headers

Bắt buộc cho các route được bảo vệ:
```
Authorization: Bearer <jwt-token>
```

Headers tùy chọn:
```
X-Request-ID: <unique-request-id>
```

## Response Headers

Tất cả các phản hồi bao gồm:
```
X-Request-ID: <request-id>
Content-Type: application/json
```

## Cấu Trúc File

```
api-gateway/
├── src/
│   ├── app.js                 # Thiết lập Express app
│   ├── config/
│   │   └── index.js          # Cấu hình
│   ├── middlewares/
│   │   ├── auth.js           # Middleware xác thực
│   │   ├── errorHandler.js   # Xử lý lỗi toàn cục
│   │   ├── rateLimit.js      # Giới hạn tốc độ
│   │   └── requestLogger.js  # Ghi log yêu cầu
│   ├── routes/
│   │   └── index.js          # Thiết lập route & proxying
│   ├── utils/
│   │   ├── constants.js      # Hằng số
│   │   ├── logger.js         # Winston logger
│   │   ├── swagger.js        # OpenAPI/Swagger
│   │   └── validators.js     # Xác thực đầu vào
│   ├── websocket/
│   │   └── proxy.js          # WebSocket proxy
│   └── test/
│       └── api-gateway.test.js
├── logs/                      # Tệp log
├── .env                       # Cấu hình môi trường
├── docker-compose.yml         # Docker compose
├── Dockerfile                 # Docker image
├── index.js                   # Điểm vào server
├── package.json               # Dependencies
└── README.md                  # File này
```

## Tính Năng Chính

### 1. Định Tuyến Service
- Tự động proxying yêu cầu đến microservices
- Viết lại đường dẫn
- Lan truyền request headers

### 2. Xác Thực
- Xác thực token JWT
- Quản lý route công khai/bảo vệ
- Lan truyền ngữ cảnh người dùng đến các services

### 3. Giới Hạn Tốc Độ
- Giới hạn tốc độ dựa trên IP
- Giới hạn có thể cấu hình
- Loại trừ health checks

### 4. Ghi Log
- Ghi log yêu cầu/phản hồi
- Theo dõi lỗi
- Tích hợp Winston logger

### 5. Xử Lý Lỗi
- Phản hồi lỗi nhất quán
- Xử lý lỗi service
- Middleware xử lý lỗi toàn cục

### 6. Hỗ Trợ WebSocket
- Cập nhật chuyến đi thời gian thực
- Streaming vị trí GPS
- Xác thực token cho WebSocket

## Phát Triển

### Thêm Route Mới

1. Cập nhật cấu hình với service URL:
```javascript
// src/config/index.js
services: {
  newService: process.env.NEW_SERVICE_URL || 'http://localhost:3011'
}
```

2. Thêm route trong routes/index.js:
```javascript
{
  path: '/new-service',
  service: 'newService',
  authRequired: true,
  options: {
    target: config.services.newService,
    changeOrigin: true,
    pathRewrite: { '^/api/v1/new-service': '/' },
    onProxyReq: addRequestHeaders,
    onError: handleProxyError('newService'),
    timeout: 10000,
  }
}
```

### Testing

```bash
npm test
```

## Docker

### Build
```bash
docker build -t cab-api-gateway:1.0.0 .
```

### Chạy
```bash
docker run -p 3000:3000 --env-file .env cab-api-gateway:1.0.0
```

## Tối Ưu Hiệu Năng

1. **Connection Pooling** - Các kết nối HTTP được tái sử dụng
2. **Response Caching** - Cân nhắc triển khai Redis caching cho các endpoint được truy cập thường xuyên
3. **Compression** - Bật gzip compression cho phản hồi
4. **Load Balancing** - Sử dụng nhiều gateway instances với load balancer

## Cân Nhắc Bảo Mật

1. **Xác Thực JWT** - Tất cả các route bảo vệ yêu cầu token JWT hợp lệ
2. **CORS** - Hạn chế origin có thể cấu hình
3. **Giới Hạn Tốc Độ** - Ngăn chặn lạm dụng và tấn công DDoS
4. **Xác Thực Yêu Cầu** - Các tiện ích xác thực đầu vào có sẵn
5. **Xử Lý Lỗi** - Thông tin nhạy cảm ẩn trong production

## Giám Sát & Chỉ Số

Log được ghi vào:
- `logs/combined.log` - Tất cả log
- `logs/error.log` - Chỉ lỗi

Mỗi mục log bao gồm:
- Timestamp
- Request ID
- Method & Path
- Status Code
- Thời gian phản hồi
- User Agent
- IP Address

## Khắc Phục Sự Cố

### Port Đã Được Sử Dụng
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux
lsof -i :3000
kill -9 <PID>
```

### Service Không Khả Dụng
- Kiểm tra xem các downstream services có đang chạy không
- Xác minh service URLs trong `.env`
- Kiểm tra log của service

### Vấn Đề Giới Hạn Tốc Độ
- Điều chỉnh `RATE_LIMIT_MAX_REQUESTS` trong `.env`
- Whitelist các IP cụ thể nếu cần