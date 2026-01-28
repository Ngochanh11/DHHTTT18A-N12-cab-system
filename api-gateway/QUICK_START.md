# Các Lệnh Bắt Đầu Nhanh

## 📋 Yêu Cầu Trước Tiên
- Node.js 16+ được cài đặt
- npm package manager
- Cổng 3000 khả dụng
- Microservices đang chạy (tùy chọn để kiểm tra các endpoint cơ bản)

## 🚀 Thiết Lập Nhanh

### 1. Cài Đặt & Cấu Hình (5 phút)
```bash
# Điều hướng đến thư mục api-gateway
cd api-gateway

# Cài đặt dependencies
npm install

# Sao chép mẫu môi trường
cp .env.example .env

# Chỉnh sửa .env với các cài đặt của bạn (nếu cần)
# nano .env  (hoặc sử dụng trình soạn thảo yêu thích của bạn)
```

### 2. Khởi Động Development Server
```bash
# Phương pháp 1: Sử dụng npm dev script
npm run dev

# Phương pháp 2: Sử dụng startup script (Windows)
start.bat

# Phương pháp 3: Sử dụng startup script (Linux/Mac)
./start.sh

# Phương pháp 4: Direct node
node index.js
```

### 3. Xác Minh Nó Đang Chạy
```bash
# Kiểm tra health endpoint
curl http://localhost:3000/api/v1/health

# Hoặc trong trình duyệt
http://localhost:3000/api/v1/health
```

## 📚 Truy Cập Tài Liệu

```
Swagger UI:        http://localhost:3000/api/v1/docs
Thay thế:          http://localhost:3000/api/v1/swagger
OpenAPI JSON:      http://localhost:3000/api/v1/openapi.json
Health Check:      http://localhost:3000/api/v1/health
Test Endpoint:     http://localhost:3000/api/v1/test
```

## 🧪 Kiểm Tra API Endpoints

### Health Check
```bash
curl http://localhost:3000/api/v1/health -s | json_pp
```

### Test Endpoint
```bash
curl http://localhost:3000/api/v1/test
```

### Đăng Nhập (Kiểm Tra Auth Service)
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 🐳 Docker Bắt Đầu Nhanh

```bash
# Build image
docker build -t cab-api-gateway .

# Chạy container
docker run -p 3000:3000 \
  --env-file .env \
  --name api-gateway \
  cab-api-gateway

# Xem logs
docker logs -f api-gateway

# Dừng container
docker stop api-gateway

# Xóa container
docker rm api-gateway
```

## 📊 Docker Compose

```bash
# Khởi động tất cả các services (nếu sử dụng docker-compose)
cd ..  # Quay lại thư mục gốc dự án
docker-compose up -d api-gateway

# Xem logs
docker-compose logs -f api-gateway

# Dừng
docker-compose down
```

## 🔍 Debug

### Xem Logs
```bash
# Logs thời gian thực (phát triển)
npm run dev

# Xem tệp log
tail -f logs/combined.log     # Tất cả logs
tail -f logs/error.log        # Chỉ lỗi
```

### Kiểm Tra Sử Dụng Cổng
```bash
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000
```

### Giết Process trên Cổng
```bash
# Windows
taskkill /PID <PID> /F

# Linux/Mac
kill -9 <PID>
```

## 🛠️ Các Vấn Đề Thường Gặp & Giải Pháp

### Vấn Đề: Cổng 3000 đã được sử dụng
```bash
# Tìm và giết process
# Windows: Xem "Kiểm Tra Sử Dụng Cổng" ở trên
# Linux/Mac: lsof -i :3000 && kill -9 <PID>

# Hoặc thay đổi cổng trong .env
PORT=3001
```

### Vấn Đề: Lỗi "Service unavailable"
**Giải pháp**: Đảm bảo các downstream microservices đang chạy trên các cổng đã cấu hình của chúng
```bash
# Kiểm tra xem các services có đang chạy không
curl http://localhost:3001/health  # Auth service
curl http://localhost:3002/health  # User service
# etc...
```

### Vấn Đề: Không thể kết nối đến service
**Giải pháp**: Cập nhật service URLs trong `.env`
```env
AUTH_SERVICE_URL=http://your-service-host:3001
```

### Vấn Đề: Lỗi CORS trong trình duyệt
**Giải pháp**: Cập nhật cấu hình CORS trong `.env`
```env
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

## 📦 Các Lệnh npm Hữu Ích

```bash
# Cài đặt packages
npm install

# Cập nhật packages
npm update

# Kiểm tra lỗ hổng bảo mật
npm audit

# Sửa lỗ hổng bảo mật
npm audit fix

# Liệt kê các packages được cài đặt
npm list

# Chạy ở chế độ phát triển (với auto-reload)
npm run dev

# Chạy ở chế độ production
npm start

# Chạy tests
npm test

# Chạy linter
npm run lint
```

## 🌐 Biến Môi Trường

### Biến Thiết Yếu
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key
```

### Service URLs
```env
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
# ... (xem .env.example cho tất cả các services)
```

### Giới Hạn Tốc Độ
```env
RATE_LIMIT_WINDOW_MS=900000    # 15 phút
RATE_LIMIT_MAX_REQUESTS=100
```

## 📞 Hỗ Trợ

Nếu bạn gặp vấn đề:

1. Kiểm tra log: `tail -f logs/combined.log`
2. Xem lại API_GATEWAY_GUIDE.md để biết tài liệu chi tiết
3. Xác minh service URLs là chính xác
4. Đảm bảo microservices đang chạy
5. Kiểm tra tính khả dụng của cổng

## ✅ Danh Sách Kiểm Tra

- [ ] Node.js được cài đặt (v16+)
- [ ] npm được cài đặt
- [ ] Thư mục api-gateway được thiết lập
- [ ] Dependencies được cài đặt (`npm install`)
- [ ] Tệp `.env` được cấu hình
- [ ] Cổng 3000 trống
- [ ] Đã khởi động dev server (`npm run dev`)
- [ ] Health check hoạt động (`/api/v1/health`)
- [ ] Swagger UI khả dụng (`/api/v1/docs`)
- [ ] Microservices đang chạy (tùy chọn)

## 📖 Các Bước Tiếp Theo

1. **Xem lại API routes** trong Swagger UI
2. **Cấu hình service URLs** nếu khác
3. **Thiết lập xác thực** tokens
4. **Kiểm tra endpoints** với curl hoặc Postman
5. **Cấu hình ghi log** như cần thiết
6. **Thiết lập giám sát** và cảnh báo
7. **Triển khai** đến môi trường của bạn

---