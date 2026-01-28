const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/auth');

// Routes công khai (không cần đăng nhập)
router.get('/stats/:userId/:userType', reviewController.getReviewStats);
router.get('/', reviewController.getReviews);

// TẤT CẢ ROUTES KHÔNG CẦN AUTH (để test)
router.post('/', reviewController.createReviewTest);
router.put('/:reviewId', reviewController.updateReview);
router.delete('/:reviewId', reviewController.deleteReview);

// Routes cần đăng nhập (TẠM THỜI TẮT)
// router.use(authMiddleware); 
// router.post('/', reviewController.createReview);

module.exports = router;