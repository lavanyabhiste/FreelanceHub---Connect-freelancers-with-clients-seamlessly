const express = require('express');
const router = express.Router();
const { createReview, getUserReviews, getProjectReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createReview);
router.get('/user/:userId', protect, getUserReviews);
router.get('/project/:projectId', protect, getProjectReviews);

module.exports = router;
