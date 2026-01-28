const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  rideId: {
    type: String,
    required: true,
    index: true
  },
  reviewerId: {
    type: String,
    required: true,
    index: true
  },
  revieweeId: {
    type: String,
    required: true,
    index: true
  },
  reviewerType: {
    type: String,
    enum: ['customer', 'driver'],
    required: true
  },
  revieweeType: {
    type: String,
    enum: ['customer', 'driver'],
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 1000
  },
  tags: [{
    type: String
  }],
  isAnonymous: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'hidden', 'reported'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes
reviewSchema.index({ reviewerId: 1, revieweeId: 1, rideId: 1 }, { unique: true });
reviewSchema.index({ revieweeType: 1, revieweeId: 1 });

module.exports = mongoose.model('Review', reviewSchema);