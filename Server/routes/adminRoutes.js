const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getUsers,
  verifyUser,
  setUserStatus,
  getProjects,
  moderateProject,
  deleteProjectByAdmin,
  getApplications,
  getTransactions,
  getDisputes,
  updateDispute,
} = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Every admin route requires JWT authentication + Admin role
router.use(protect, isAdmin);

// Statistics
router.get('/stats', getAdminStats);

// User management
router.get('/users', getUsers);
router.patch('/users/:id/verify', verifyUser);
router.patch('/users/:id/status', setUserStatus);

// Project moderation
router.get('/projects', getProjects);
router.patch('/projects/:id/status', moderateProject);
router.delete('/projects/:id', deleteProjectByAdmin);

// Application monitoring
router.get('/applications', getApplications);

// Transactions
router.get('/transactions', getTransactions);

// Dispute management
router.get('/disputes', getDisputes);
router.patch('/disputes/:id', updateDispute);

module.exports = router;
