# 🚕 CAB Booking System - API Gateway

## 📌 Tổng Quan

API Gateway là điểm vào trung tâm cho tất cả các yêu cầu từ client trong CAB Booking System. Nó cung cấp:

- ✅ Định tuyến yêu cầu đến 9+ microservices
- ✅ Xác thực & phân quyền JWT
- ✅ Giới hạn tốc độ (100 yêu cầu/15 phút)
- ✅ Ghi log yêu cầu/phản hồi
- ✅ Hỗ trợ WebSocket cho cập nhật thời gian thực
- ✅ Xử lý lỗi toàn diện
- ✅ Tài liệu OpenAPI/Swagger
- ✅ Setup sẵn sàng cho production

---

## 🚀 Bắt Đầu Nhanh (5 phút)

### 1. Cài Đặt
```bash
cd api-gateway
npm install
```

### 2. Cấu Hình
```bash
cp .env.example .env
# Chỉnh sửa .env nếu cần
```

### 3. Chạy
```bash
npm run dev
```

### 4. Truy Cập
```
API Docs:  http://localhost:3000/api/v1/docs
Health:    http://localhost:3000/api/v1/health
```

**Xem [QUICK_START.md](QUICK_START.md) để biết chi tiết**

---

## 📚 Tài Liệu

### Để Bắt Đầu
→ **[QUICK_START.md](QUICK_START.md)** - Hướng dẫn setup 5 phút với các lệnh

### Tài Liệu Đầy Đủ
→ **[API_GATEWAY_GUIDE.md](API_GATEWAY_GUIDE.md)** - Tài liệu chi tiết bao gồm:
- Tổng quan kiến trúc
- Tất cả các route API
- Cấu hình môi trường
- Cách sử dụng WebSocket
- Xử lý lỗi
- Tối ưu hóa hiệu năng
- Khắc phục sự cố

### Chi Tiết Triển Khai
→ **[CODE_GENERATION_SUMMARY.md](CODE_GENERATION_SUMMARY.md)** - Những gì được tạo:
- Cấu trúc file và thay đổi
- Các tính năng được triển khai
- Tùy chọn cấu hình
- Các bước tiếp theo

---

## 🏗️ Kiến Trúc

```
Clients (Web, Mobile, Admin)
        ↓
   API Gateway (Port 3000)
        ↓
   ┌────────────────────────────────────┐
   │ Định Tuyến & Proxying              │
   ├────────────────────────────────────┤
   │ • Xác thực yêu cầu                 │
   │ • Xác thực & Phân quyền            │
   │ • Giới hạn tốc độ                  │
   │ • Ghi log yêu cầu/phản hồi         │
   │ • Xử lý lỗi                        │
   └────────────────────────────────────┘
        ↓
   ┌─────┬─────┬─────┬─────┬─────┬─────┐
   ↓     ↓     ↓     ↓     ↓     ↓     ↓
 Auth  User Driver Book Ride Payment Price
3001  3002  3003   3004  3005  3007   3008
```

---

## 📊 Tính Năng Chính

### 1. **Định Tuyến Service**
Tự động định tuyến các yêu cầu đến 9+ microservices:
- Auth Service (3001)
- User Service (3002)
- Driver Service (3003)
- Booking Service (3004)
- Ride Service (3005)
- Payment Service (3007)
- Pricing Service (3008)
- Notification Service (3009)
- Review Service (3010)

### 2. **Xác Thực**
- Xác thực token JWT
- Quản lý route công khai/bảo vệ
- Lan truyền ngữ cảnh người dùng

### 3. **Giới Hạn Tốc Độ**
- 100 yêu cầu trên 15 phút mỗi IP
- Cấu hình thông qua môi trường
- Loại trừ các endpoint health check

### 4. **Ghi Log & Giám Sát**
- Ghi log yêu cầu/phản hồi
- Theo dõi ID yêu cầu
- Chỉ số hiệu năng
- Ghi log lỗi

### 5. **Hỗ Trợ WebSocket**
- Cập nhật vị trí GPS thời gian thực
- Thay đổi trạng thái chuyến đi
- Kết nối liên tục

### 6. **Tài Liệu API**
- Swagger UI (`/api/v1/docs`)
- Thông số kỹ thuật OpenAPI JSON (`/api/v1/openapi.json`)
- Tạo tự động từ các route

---

## 🔧 Cấu Hình

### Biến Môi Trường

```env
# Server
PORT=3000
NODE_ENV=development

# URLs Service
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
# ... (9 services total)

# Bảo Mật
JWT_SECRET=your-secret-key

# Giới Hạn Tốc Độ
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=*

# Ghi Log
LOG_LEVEL=debug
```

**Xem [.env.example](.env.example) cho tất cả các tùy chọn**

---

## 📂 Cấu Trúc File

```
api-gateway/
├── src/
│   ├── app.js                          # Express app
│   ├── config/index.js                 # Cấu hình
│   ├── middlewares/
│   │   ├── auth.js                     # Xác thực
│   │   ├── errorHandler.js             # Xử lý lỗi
│   │   ├── rateLimit.js                # Giới hạn tốc độ
│   │   └── requestLogger.js            # Ghi log yêu cầu
│   ├── routes/index.js                 # Định tuyến service
│   ├── utils/
│   │   ├── constants.js                # Hằng số
│   │   ├── logger.js                   # Ghi log
│   │   ├── swagger.js                  # OpenAPI/Swagger
│   │   └── validators.js               # Xác thực
│   ├── websocket/proxy.js              # WebSocket proxy
│   └── test/app.test.js                # Tests
├── logs/                               # Tệp log
├── .env                                # Cấu hình
├── .env.example                        # Mẫu cấu hình
├── index.js                            # Điểm vào
├── package.json                        # Dependencies
├── Dockerfile                          # Docker image
├── docker-compose.yml                  # Docker compose
├── QUICK_START.md                      # Hướng dẫn setup nhanh
├── API_GATEWAY_GUIDE.md                # Tài liệu đầy đủ
└── README.md                           # File này
```

---

## 🎯 Các Endpoint API

### Health & Tài Liệu
- `GET /health` - Health check cũ
- `GET /api/v1/health` - Health check tiêu chuẩn
- `GET /api/v1/test` - Endpoint test
- `GET /api/v1/docs` - Swagger UI
- `GET /api/v1/openapi.json` - OpenAPI spec

### Route Công Khai (Không cần Auth)
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/refresh`

### Route Bảo Vệ (Yêu cầu JWT)
Tất cả các route ngoài những route công khai yêu cầu:
```
Authorization: Bearer <jwt-token>
```

Ví dụ:
- `GET /api/v1/users/*`
- `GET /api/v1/drivers/*`
- `GET/POST /api/v1/bookings/*`
- `GET/PATCH /api/v1/rides/*`
- `POST /api/v1/payments/*`
- `GET /api/v1/pricings/*`

### WebSocket
- `ws://localhost:3000/api/v1/ws/ride` - Cập nhật chuyến đi thời gian thực

**Xem [API_GATEWAY_GUIDE.md](API_GATEWAY_GUIDE.md) để biết danh sách route đầy đủ**

---

## 🚀 Chạy

### Phát Triển
```bash
npm run dev
# Tự động khởi động lại khi file thay đổi
```

### Production
```bash
npm start
```

### Docker
```bash
# Build
docker build -t cab-api-gateway .

# Chạy
docker run -p 3000:3000 --env-file .env cab-api-gateway
```

---

## 📊 Định Dạng Phản Hồi

### Phản Hồi Thành Công
```json
{
  "status": "success",
  "data": { /* data */ }
}
```

### Phản Hồi Lỗi
```json
{
  "error": "Error Type",
  "message": "Thông báo dễ hiểu",
  "timestamp": "2024-01-27T10:30:00Z",
  "service": "service-name"
}
```

---

## 🔐 Xác Thực

Tất cả các route bảo vệ yêu cầu token JWT trong header:

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v1/users
```

Token được lấy qua:
```bash
POST /api/v1/auth/login
```

---

## 📈 Giới Hạn Tốc Độ

**Mặc định**: 100 yêu cầu trên 15 phút mỗi IP

Response headers:
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1706347800
```

Cấu hình trong `.env`:
```env
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

---

## 🧪 Testing

```bash
# Chạy test
npm test

# Kiểm tra health
curl http://localhost:3000/api/v1/health

# Truy cập Swagger UI
open http://localhost:3000/api/v1/docs
```

---

## 🐛 Khắc Phục Sự Cố

### Port Đã Được Sử Dụng
```bash
# Tìm process
lsof -i :3000

# Giết process
kill -9 <PID>
```

### Service Không Khả Dụng
- Kiểm tra xem các microservices có đang chạy không
- Xác minh URLs trong `.env`
- Kiểm tra log của service

### Lỗi CORS
- Cập nhật `CORS_ORIGIN` trong `.env`
- Mặc định là `*` (tất cả origins)

**Xem [API_GATEWAY_GUIDE.md](API_GATEWAY_GUIDE.md#troubleshooting) để biết thêm**

---

## 📦 Dependencies

Các packages chính:
- **express** - Web framework
- **http-proxy-middleware** - Request proxying
- **jsonwebtoken** - JWT handling
- **express-rate-limit** - Giới hạn tốc độ
- **cors** - CORS handling
- **winston** - Ghi log
- **dotenv** - Cấu hình môi trường

Xem [package.json](package.json) để biết danh sách đầy đủ

---

## 🔄 Workflow

```
1. Yêu Cầu từ Client
   ↓
2. API Gateway Nhận
   ↓
3. Kiểm Tra Giới Hạn Tốc Độ
   ↓
4. Xác Thực (nếu cần)
   ↓
5. Định Tuyến đến Service
   ↓
6. Phản Hồi từ Service
   ↓
7. Ghi Log & Định Dạng Phản Hồi
   ↓
8. Trả Về cho Client
```

---

## 📖 Liên Kết Tài Liệu

| Tài Liệu | Mục Đích |
|----------|---------|
| [QUICK_START.md](QUICK_START.md) | Hướng dẫn setup 5 phút |
| [API_GATEWAY_GUIDE.md](API_GATEWAY_GUIDE.md) | Tài liệu tham khảo đầy đủ |
| [.env.example](.env.example) | Mẫu cấu hình |
| [package.json](package.json) | Dependencies |

---

## 🎓 Các Bước Tiếp Theo

1. **Đọc** [QUICK_START.md](QUICK_START.md) để setup
2. **Cấu hình** `.env` với service URLs của bạn
3. **Khởi động** gateway (`npm run dev`)
4. **Test** endpoints qua Swagger UI (`/api/v1/docs`)
5. **Theo dõi** logs (`logs/combined.log`)
6. **Deploy** sử dụng Docker khi sẵn sàng

---

## 📞 Hỗ Trợ

Nếu có vấn đề:
1. Kiểm tra **logs/combined.log**
2. Xem lại [API_GATEWAY_GUIDE.md](API_GATEWAY_GUIDE.md)
3. Xác minh các microservices đang chạy
4. Kiểm tra cấu hình môi trường

---