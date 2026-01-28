const Review = require('../models/Review');
const {
  createReviewSchema,
  updateReviewSchema,
  getReviewsSchema
} = require('../validators/reviewValidator');

class ReviewController {
  // Tạo đánh giá mới (test - không cần auth)
  async createReviewTest(req, res) {
    try {
      console.log('📝 Creating test review with data:', req.body);
      
      const { error, value } = createReviewSchema.validate(req.body);
      if (error) {
        console.log('❌ Validation error:', error.details);
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: error.details
        });
      }

      // Mock user cho test
      const reviewerId = 'test-customer-123';
      const reviewerType = 'customer';

      console.log('🔍 Checking existing review...');
      // Kiểm tra xem đã đánh giá chuyến xe này chưa
      const existingReview = await Review.findOne({
        rideId: value.rideId,
        reviewerId: reviewerId,
        revieweeId: value.revieweeId
      });

      if (existingReview) {
        console.log('⚠️ Review already exists');
        return res.status(409).json({
          success: false,
          message: 'Bạn đã đánh giá chuyến xe này rồi'
        });
      }

      console.log('💾 Creating new review...');
      const review = await Review.create({
        ...value,
        reviewerId,
        reviewerType
      });

      console.log('✅ Review created successfully:', review._id);
      res.status(201).json({
        success: true,
        message: 'Tạo đánh giá thành công (test mode)',
        data: review
      });
    } catch (error) {
      console.error('❌ Error creating test review:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo đánh giá',
        error: error.message
      });
    }
  }

  // Tạo đánh giá mới
  async createReview(req, res) {
    try {
      const { error, value } = createReviewSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: error.details
        });
      }

      // Lấy thông tin người đánh giá từ token (giả sử đã có middleware auth)
      const reviewerId = req.user.id;
      const reviewerType = req.user.type; // 'customer' hoặc 'driver'

      // Kiểm tra xem đã đánh giá chuyến xe này chưa
      const existingReview = await Review.findOne({
        rideId: value.rideId,
        reviewerId: reviewerId,
        revieweeId: value.revieweeId
      });

      if (existingReview) {
        return res.status(409).json({
          success: false,
          message: 'Bạn đã đánh giá chuyến xe này rồi'
        });
      }

      const review = await Review.create({
        ...value,
        reviewerId,
        reviewerType
      });

      res.status(201).json({
        success: true,
        message: 'Tạo đánh giá thành công',
        data: review
      });
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo đánh giá'
      });
    }
  }

  // Lấy danh sách đánh giá
  async getReviews(req, res) {
    try {
      const { error, value } = getReviewsSchema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Tham số không hợp lệ',
          errors: error.details
        });
      }

      const { page, limit, sortBy, sortOrder, ...filters } = value;
      const skip = (page - 1) * limit;

      const query = { status: 'active' };
      if (filters.revieweeId) query.revieweeId = filters.revieweeId;
      if (filters.reviewerId) query.reviewerId = filters.reviewerId;
      if (filters.revieweeType) query.revieweeType = filters.revieweeType;
      if (filters.rating) query.rating = filters.rating;

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const [reviews, totalCount] = await Promise.all([
        Review.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .select(req.user ? '' : '-reviewerId'), // Ẩn reviewerId nếu không đăng nhập
        Review.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: {
          reviews: reviews,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalItems: totalCount,
            itemsPerPage: limit
          }
        }
      });
    } catch (error) {
      console.error('Error getting reviews:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách đánh giá'
      });
    }
  }

  // Lấy thống kê đánh giá của một user
  async getReviewStats(req, res) {
    try {
      const { userId, userType } = req.params;

      const pipeline = [
        {
          $match: {
            revieweeId: userId,
            revieweeType: userType,
            status: 'active'
          }
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
            fiveStars: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
            fourStars: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
            threeStars: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
            twoStars: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
            oneStar: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
          }
        }
      ];

      const result = await Review.aggregate(pipeline);
      const stats = result[0] || {
        averageRating: 0,
        totalReviews: 0,
        fiveStars: 0,
        fourStars: 0,
        threeStars: 0,
        twoStars: 0,
        oneStar: 0
      };

      // Làm tròn averageRating
      stats.averageRating = Math.round(stats.averageRating * 10) / 10;

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting review stats:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thống kê đánh giá'
      });
    }
  }

  // Cập nhật đánh giá (chỉ người tạo mới được cập nhật)
  async updateReview(req, res) {
    try {
      const { reviewId } = req.params;
      const { error, value } = updateReviewSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: error.details
        });
      }

      const review = await Review.findOne({
        _id: reviewId,
        reviewerId: req.user.id
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đánh giá hoặc bạn không có quyền chỉnh sửa'
        });
      }

      Object.assign(review, value);
      await review.save();

      res.json({
        success: true,
        message: 'Cập nhật đánh giá thành công',
        data: review
      });
    } catch (error) {
      console.error('Error updating review:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật đánh giá'
      });
    }
  }

  // Xóa đánh giá (soft delete)
  async deleteReview(req, res) {
    try {
      const { reviewId } = req.params;

      const review = await Review.findOne({
        _id: reviewId,
        reviewerId: req.user.id
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đánh giá hoặc bạn không có quyền xóa'
        });
      }

      review.status = 'hidden';
      await review.save();

      res.json({
        success: true,
        message: 'Xóa đánh giá thành công'
      });
    } catch (error) {
      console.error('Error deleting review:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa đánh giá'
      });
    }
  }
}

module.exports = new ReviewController();