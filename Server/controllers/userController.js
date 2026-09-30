const User = require('../models/User');

// @desc  Get a freelancer's public profile
// @route GET /api/users/freelancers/:id
// @access Private
const getFreelancerProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user || user.role !== 'Freelancer') {
      return res.status(404).json({ success: false, message: 'Freelancer not found.' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc  Get list of freelancers (for client browsing)
// @route GET /api/users/freelancers
// @access Private
const getFreelancers = async (req, res, next) => {
  try {
    const { skill, search, page = 1, limit = 10 } = req.query;
    const filter = { role: 'Freelancer' };
    if (skill) filter.skills = { $in: [skill] };
    if (search) filter.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ rating: -1, totalReviews: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      users,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getFreelancerProfile, getFreelancers };
