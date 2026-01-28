const Joi = require('joi');

const createReviewSchema = Joi.object({
  rideId: Joi.string().required(),
  revieweeId: Joi.string().required(),
  revieweeType: Joi.string().valid('customer', 'driver').required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(1000).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  isAnonymous: Joi.boolean().optional()
});

const updateReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).optional(),
  comment: Joi.string().max(1000).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  isAnonymous: Joi.boolean().optional()
});

const getReviewsSchema = Joi.object({
  revieweeId: Joi.string().optional(),
  reviewerId: Joi.string().optional(),
  revieweeType: Joi.string().valid('customer', 'driver').optional(),
  rating: Joi.number().integer().min(1).max(5).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('createdAt', 'rating').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

module.exports = {
  createReviewSchema,
  updateReviewSchema,
  getReviewsSchema
};