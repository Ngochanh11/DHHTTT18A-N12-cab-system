# Review Service

Service quản lý đánh giá và xếp hạng trong hệ thống ride-sharing.

## Tính năng chính

- ✅ Tạo, cập nhật, xóa đánh giá
- ✅ Lấy danh sách đánh giá với phân trang và lọc
- ✅ Thống kê đánh giá (điểm trung bình, phân bố sao)
- ✅ Hỗ trợ đánh giá ẩn danh
- ✅ Tích hợp Kafka cho real-time events
- ✅ Validation dữ liệu đầu vào
- ✅ Authentication middleware

## Cài đặt

1. Cài đặt dependencies:
```bash
cd services/review-service
npm install
```

2. Tạo file .env từ .env.example:
```bash
cp .env.example .env
```

3. Cấu hình database PostgreSQL và Kafka trong file .env

4. Chạy service:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Public Endpoints

#### GET /api/reviews
Lấy danh sách đánh giá

**Query Parameters:**
- `revieweeId` (UUID): ID người được đánh giá
- `revieweeType` (string): Loại người được đánh giá (customer/driver)
- `rating` (number): Lọc theo số sao (1-5)
- `page` (number): Trang hiện tại (default: 1)
- `limit` (number): Số item per page (default: 10, max: 100)
- `sortBy` (string): Sắp xếp theo (createdAt/rating)
- `sortOrder` (string): Thứ tự sắp xếp (asc/desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  }
}
```

#### GET /api/reviews/stats/:userId/:userType
Lấy thống kê đánh giá của một user

**Response:**
```json
{
  "success": true,
  "data": {
    "averageRating": 4.5,
    "totalReviews": 100,
    "fiveStars": 60,
    "fourStars": 30,
    "threeStars": 8,
    "twoStars": 2,
    "oneStar": 0
  }
}
```

### Protected Endpoints (Cần Authentication)

#### POST /api/reviews
Tạo đánh giá mới

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Body:**
```json
{
  "rideId": "uuid",
  "revieweeId": "uuid",
  "revieweeType": "driver",
  "rating": 5,
  "comment": "Tài xế rất thân thiện và lái xe an toàn",
  "tags": ["friendly", "punctual", "clean_car"],
  "isAnonymous": false
}
```

#### PUT /api/reviews/:reviewId
Cập nhật đánh giá (chỉ người tạo)

#### DELETE /api/reviews/:reviewId
Xóa đánh giá (soft delete)

## Database Schema

### Table: reviews

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| rideId | UUID | ID chuyến xe |
| reviewerId | UUID | ID người đánh giá |
| revieweeId | UUID | ID người được đánh giá |
| reviewerType | ENUM | Loại người đánh giá (customer/driver) |
| revieweeType | ENUM | Loại người được đánh giá (customer/driver) |
| rating | INTEGER | Điểm đánh giá (1-5) |
| comment | TEXT | Bình luận |
| tags | ARRAY | Các tag đánh giá |
| isAnonymous | BOOLEAN | Đánh giá ẩn danh |
| status | ENUM | Trạng thái (active/hidden/reported) |
| createdAt | TIMESTAMP | Thời gian tạo |
| updatedAt | TIMESTAMP | Thời gian cập nhật |

## Kafka Events

### Consumed Events
- `ride-completed`: Khi chuyến xe hoàn thành
- `user-banned`: Khi user bị ban

### Published Events
- `review-created`: Khi có đánh giá mới
- `review-reminder`: Nhắc nhở đánh giá

## Environment Variables

```env
PORT=4006
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=review_db
DB_USER=postgres
DB_PASSWORD=password
KAFKA_BROKER=localhost:9092
KAFKA_CLIENT_ID=review-service
KAFKA_GROUP_ID=review-group
JWT_SECRET=your-jwt-secret-key
```

## Testing

```bash
# Test health endpoint
curl http://localhost:4006/health

# Test get reviews
curl "http://localhost:4006/api/reviews?revieweeId=uuid&revieweeType=driver"

# Test create review (cần token)
curl -X POST http://localhost:4006/api/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "rideId": "uuid",
    "revieweeId": "uuid", 
    "revieweeType": "driver",
    "rating": 5,
    "comment": "Great driver!"
  }'
```

## Docker

Service này có thể chạy với Docker:

```bash
docker build -t review-service .
docker run -p 4006:4006 review-service
```