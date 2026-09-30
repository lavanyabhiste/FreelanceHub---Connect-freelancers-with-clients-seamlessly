const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
} = require('../controllers/authController');
const {
  protect,
  isClient,
  isFreelancer,
  isAdmin,
} = require('../middleware/authMiddleware');

// Public authentication routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Private authenticated route
router.get('/me', protect, getMe);

// Role-protected verification routes
router.get('/client-only', protect, isClient, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authorized! Welcome to the Client-only dashboard route.',
    user: req.user,
  });
});

router.get('/freelancer-only', protect, isFreelancer, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authorized! Welcome to the Freelancer-only dashboard route.',
    user: req.user,
  });
});

router.get('/admin-only', protect, isAdmin, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Authorized! Welcome to the Admin moderation route.',
    user: req.user,
  });
});

module.exports = router;
