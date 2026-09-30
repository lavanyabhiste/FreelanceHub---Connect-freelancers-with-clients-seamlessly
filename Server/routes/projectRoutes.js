const express = require('express');
const router = express.Router();
const {
  createProject,
  getMyProjects,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectApplications,
  getClientApplications,
  updateApplicationStatus,
  markProjectCompleted,
  requestRevision,
  getClientStats,
} = require('../controllers/projectController');
const { protect, isClient } = require('../middleware/authMiddleware');

// Stats (must be before /:id)
router.get('/stats/client', protect, isClient, getClientStats);
router.get('/my', protect, isClient, getMyProjects);

// Public browse feed — Open projects only, safe public fields (name/rating).
// Guests can browse; actions require login.
router.get('/', getAllProjects);
// Client: applications received across all my projects (must be before /:id)
router.get('/applications/mine', protect, isClient, getClientApplications);
router.get('/:id', protect, getProjectById);

// Client-only project management
router.post('/', protect, isClient, createProject);
router.put('/:id', protect, isClient, updateProject);
router.delete('/:id', protect, isClient, deleteProject);

// Application management by client
router.get('/:id/applications', protect, isClient, getProjectApplications);
router.patch('/:id/applications/:appId/status', protect, isClient, updateApplicationStatus);

// Project lifecycle actions
router.patch('/:id/complete', protect, isClient, markProjectCompleted);
router.patch('/:id/revision', protect, isClient, requestRevision);

module.exports = router;
