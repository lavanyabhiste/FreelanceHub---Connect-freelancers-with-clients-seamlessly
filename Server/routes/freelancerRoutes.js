const express = require('express');
const router = express.Router();
const {
  updateProfile,
  getMyApplications,
  submitBid,
  submitWork,
  getFreelancerStats,
  getMyFreelancerProjects,
} = require('../controllers/freelancerController');
const { protect, isFreelancer } = require('../middleware/authMiddleware');

router.use(protect, isFreelancer);

router.put('/profile', updateProfile);
router.get('/applications', getMyApplications);
router.post('/bid', submitBid);
router.post('/submit-work', submitWork);
router.get('/stats', getFreelancerStats);
router.get('/my-projects', getMyFreelancerProjects);

module.exports = router;
