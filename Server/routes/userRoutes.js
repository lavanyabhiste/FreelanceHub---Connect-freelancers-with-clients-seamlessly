const express = require('express');
const router = express.Router();
const { getFreelancerProfile, getFreelancers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/freelancers', protect, getFreelancers);
router.get('/freelancers/:id', protect, getFreelancerProfile);

module.exports = router;
