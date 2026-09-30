const Review = require('../models/Review');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const Chat = require('../models/Chat');

// ─── @desc  Post a review after project completion ───────────────────────────
// @route POST /api/reviews
// @access Private
const createReview = async (req, res, next) => {
  try {
    const { projectId, reviewedUserId, rating, comment } = req.body;

    if (!projectId || !reviewedUserId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide projectId, reviewedUserId, rating, and comment.',
      });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    if (project.status !== 'Completed') {
      return res.status(400).json({ success: false, message: 'Reviews can only be submitted for completed projects.' });
    }

    // Authorization: reviewer must be client or selectedFreelancer
    const isClient = project.client.toString() === req.user._id.toString();
    const isFreelancer =
      project.selectedFreelancer &&
      project.selectedFreelancer.toString() === req.user._id.toString();

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ success: false, message: 'You are not authorized to review this project.' });
    }

    // Prevent self-review
    if (reviewedUserId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot review yourself.' });
    }

    // Check for duplicate review
    const existing = await Review.findOne({ project: projectId, reviewer: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already submitted a review for this project.' });
    }

    const review = await Review.create({
      project: projectId,
      reviewer: req.user._id,
      reviewedUser: reviewedUserId,
      rating: Number(rating),
      comment: comment.trim(),
    });

    // Notify the reviewed user about their new review
    await Notification.create({
      recipient: reviewedUserId,
      type: 'new_review',
      title: 'You Received a New Review ⭐',
      message: `${req.user.name} left you a ${rating}-star review on "${project.title}".`,
      relatedProject: project._id,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${reviewedUserId}`).emit('notification', {
        type: 'new_review',
        projectId: project._id,
        title: 'You Received a New Review ⭐',
        message: `${req.user.name} left you a ${rating}-star review.`,
      });
    }

    res.status(201).json({ success: true, message: 'Review submitted successfully.', review });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  Get reviews for a specific user ───────────────────────────────────
// @route GET /api/reviews/user/:userId
// @access Public
const getUserReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [reviews, total] = await Promise.all([
      Review.find({ reviewedUser: req.params.userId })
        .populate('reviewer', 'name profileImage role')
        .populate('project', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments({ reviewedUser: req.params.userId }),
    ]);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      totalPages: Math.max(1, Math.ceil(total / Number(limit))),
      currentPage: Number(page),
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  Get reviews left on a specific project ──────────────────────────
// @route GET /api/reviews/project/:projectId
// @access Private (project participants only)
const getProjectReviews = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    const isClient = project.client.toString() === req.user._id.toString();
    const isFreelancer =
      project.selectedFreelancer &&
      project.selectedFreelancer.toString() === req.user._id.toString();
    if (!isClient && !isFreelancer) {
      return res.status(403).json({ success: false, message: 'Not authorized to view these reviews.' });
    }

    const reviews = await Review.find({ project: project._id })
      .populate('reviewer', 'name profileImage role')
      .populate('reviewedUser', 'name profileImage role')
      .sort({ createdAt: -1 });

    const hasReviewed = reviews.some(
      (r) => r.reviewer?._id?.toString() === req.user._id.toString() || r.reviewer?.toString() === req.user._id.toString()
    );

    res.status(200).json({ success: true, count: reviews.length, reviews, hasReviewed });
  } catch (error) {
    next(error);
  }
};

module.exports = { createReview, getUserReviews, getProjectReviews };
