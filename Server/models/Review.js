const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Review must be linked to a project'],
      index: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must specify a reviewer'],
      index: true,
    },
    reviewedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must specify the user being reviewed'],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating between 1 and 5'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      required: [true, 'Please provide a written review comment'],
      trim: true,
      maxlength: [2000, 'Review comment cannot exceed 2000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// One review per reviewer per project
reviewSchema.index({ project: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ reviewedUser: 1, createdAt: -1 });

// Static method to calculate and update average rating and total review count on User
reviewSchema.statics.calculateAverageRating = async function (userId) {
  const stats = await this.aggregate([
    {
      $match: { reviewedUser: new mongoose.Types.ObjectId(userId) },
    },
    {
      $group: {
        _id: '$reviewedUser',
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
      },
    },
  ]);

  try {
    if (stats.length > 0) {
      await mongoose.model('User').findByIdAndUpdate(userId, {
        rating: Math.round(stats[0].averageRating * 10) / 10,
        totalReviews: stats[0].totalReviews,
      });
    } else {
      await mongoose.model('User').findByIdAndUpdate(userId, {
        rating: 0,
        totalReviews: 0,
      });
    }
  } catch (err) {
    console.error(`Error updating user rating statistics: ${err.message}`);
  }
};

// Post-save hook to re-aggregate rating stats
reviewSchema.post('save', async function () {
  await this.constructor.calculateAverageRating(this.reviewedUser);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
