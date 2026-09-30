const Project = require('../models/Project');
const Application = require('../models/Application');
const Chat = require('../models/Chat');
const Notification = require('../models/Notification');
const { createEscrowTransaction, releaseEscrowForProject } = require('./transactionController');

// ─── Helper ─────────────────────────────────────────────────────────────────
const parseSkills = (skills) => {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills.map((s) => s.trim()).filter(Boolean);
  return skills.split(',').map((s) => s.trim()).filter(Boolean);
};

// ─── @desc  Create a new project ─────────────────────────────────────────────
// @route POST /api/projects
// @access Private – Client
const createProject = async (req, res, next) => {
  try {
    const {
      title, description, category,
      requiredSkills, budget, duration, deadline,
    } = req.body;

    if (!title || !description || !category || !budget || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, category, budget, and duration.',
      });
    }

    const project = await Project.create({
      client: req.user._id,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      requiredSkills: parseSkills(requiredSkills),
      budget: Number(budget),
      duration: duration.trim(),
      deadline: deadline ? new Date(deadline) : undefined,
      status: 'Open',
    });

    res.status(201).json({ success: true, message: 'Project created successfully.', project });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  Get all projects owned by logged-in client ───────────────────────
// @route GET /api/projects/my
// @access Private – Client
const getMyProjects = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { client: req.user._id };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('selectedFreelancer', 'name email profileImage rating')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Project.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: projects.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      projects,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  Get all open projects (marketplace feed) ─────────────────────────
// @route GET /api/projects
// @access Private – Any authenticated user
const getAllProjects = async (req, res, next) => {
  try {
    const { category, skill, minBudget, maxBudget, search, page = 1, limit = 10 } = req.query;
    const filter = { status: 'Open' };

    if (category) filter.category = category;
    if (skill) filter.requiredSkills = { $in: [skill] };
    if (minBudget || maxBudget) {
      filter.budget = {};
      if (minBudget) filter.budget.$gte = Number(minBudget);
      if (maxBudget) filter.budget.$lte = Number(maxBudget);
    }
    if (search) filter.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('client', 'name profileImage rating')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Project.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: projects.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      projects,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  Get single project by ID ─────────────────────────────────────────
// @route GET /api/projects/:id
// @access Private
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name email profileImage rating totalReviews')
      .populate('selectedFreelancer', 'name email profileImage rating skills bio');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    res.status(200).json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  Update a project ──────────────────────────────────────────────────
// @route PUT /api/projects/:id
// @access Private – Client (owner)
const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to edit this project.' });
    }

    if (!['Open'].includes(project.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only Open projects can be edited.',
      });
    }

    const allowed = ['title', 'description', 'category', 'requiredSkills', 'budget', 'duration', 'deadline'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'requiredSkills') {
          project.requiredSkills = parseSkills(req.body[field]);
        } else {
          project[field] = req.body[field];
        }
      }
    });

    await project.save();
    res.status(200).json({ success: true, message: 'Project updated successfully.', project });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  Delete (cancel) a project ────────────────────────────────────────
// @route DELETE /api/projects/:id
// @access Private – Client (owner)
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (!['Open', 'Cancelled'].includes(project.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only Open projects can be cancelled.',
      });
    }

    project.status = 'Cancelled';
    await project.save();

    res.status(200).json({ success: true, message: 'Project cancelled successfully.' });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  Get all applications for a project ───────────────────────────────
// @route GET /api/projects/:id/applications
// @access Private – Client (owner)
const getProjectApplications = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const applications = await Application.find({ project: req.params.id })
      .populate('freelancer', 'name email profileImage rating totalReviews skills bio experience')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: applications.length, applications });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  All applications received across the client's projects ──────────
// @route GET /api/projects/applications/mine
// @access Private – Client
const getClientApplications = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    // Restrict to projects owned by this client
    const myProjects = await Project.find({ client: req.user._id }).select('_id');
    const projectIds = myProjects.map((p) => p._id);

    const filter = { project: { $in: projectIds } };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate({ path: 'project', select: 'title status budget client' })
        .populate('freelancer', 'name email profileImage rating totalReviews skills')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Application.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: applications.length,
      total,
      totalPages: Math.max(1, Math.ceil(total / Number(limit))),
      currentPage: Number(page),
      applications,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  Approve or reject an application ─────────────────────────────────
// @route PATCH /api/projects/:id/applications/:appId/status
// @access Private – Client (owner)
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // 'Approved' | 'Rejected'

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'Approved' or 'Rejected'." });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (project.status !== 'Open') {
      return res.status(400).json({ success: false, message: 'This project is no longer accepting changes.' });
    }

    const application = await Application.findById(req.params.appId);
    if (!application || application.project.toString() !== req.params.id) {
      return res.status(404).json({ success: false, message: 'Application not found for this project.' });
    }

    // Approve flow
    if (status === 'Approved') {
      const alreadyApproved = await Application.findOne({
        project: req.params.id,
        status: 'Approved',
        _id: { $ne: req.params.appId },
      });
      if (alreadyApproved) {
        return res.status(400).json({ success: false, message: 'A freelancer is already approved for this project.' });
      }

      application.status = 'Approved';
      await application.save();

      // Update project – set In Progress + selectedFreelancer
      project.status = 'In Progress';
      project.selectedFreelancer = application.freelancer;
      await project.save();

      // Create chat room between client and freelancer
      const existingChat = await Chat.findOne({
        project: project._id,
        client: req.user._id,
        freelancer: application.freelancer,
      });

      if (!existingChat) {
        await Chat.create({
          project: project._id,
          client: req.user._id,
          freelancer: application.freelancer,
          participants: [req.user._id, application.freelancer],
        });
      }

      // Create escrow transaction (mock payment → Pending) for the approved bid
      try {
        await createEscrowTransaction({
          project,
          amount: application.bidAmount || project.budget,
          io: req.app.get('io'),
        });
      } catch (escrowError) {
        console.error('[Escrow] Failed to create transaction:', escrowError.message);
      }

      // Notify freelancer
      await Notification.create({
        recipient: application.freelancer,
        type: 'application_approved',
        title: 'Your Proposal Was Approved! 🎉',
        message: `Congratulations! Your proposal for "${project.title}" has been approved. You can now start chatting with the client.`,
        relatedProject: project._id,
      });

      // Emit real-time notification via Socket.IO if available
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${application.freelancer}`).emit('notification', {
          type: 'application_approved',
          projectId: project._id,
          title: 'Your Proposal Was Approved! 🎉',
          message: `Your proposal for "${project.title}" was approved!`,
        });
      }

    } else {
      // Reject
      application.status = 'Rejected';
      await application.save();

      await Notification.create({
        recipient: application.freelancer,
        type: 'application_rejected',
        title: 'Proposal Status Update',
        message: `Your proposal for "${project.title}" was not selected. Keep applying to other projects!`,
        relatedProject: project._id,
      });

      const ioRej = req.app.get('io');
      if (ioRej) {
        ioRej.to(`user_${application.freelancer}`).emit('notification', {
          type: 'application_rejected',
          projectId: project._id,
          title: 'Proposal Status Update',
          message: `Your proposal for "${project.title}" was not selected.`,
        });
      }
    }

    res.status(200).json({ success: true, message: `Application ${status} successfully.`, application });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  Mark project as Completed ─────────────────────────────────────────
// @route PATCH /api/projects/:id/complete
// @access Private – Client (owner)
const markProjectCompleted = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (project.status !== 'Submitted') {
      return res.status(400).json({
        success: false,
        message: 'You can only complete a project once the freelancer has submitted work.',
      });
    }

    project.status = 'Completed';
    await project.save();

    // Release escrow payment to the freelancer (Pending → Completed)
    try {
      await releaseEscrowForProject({ project, io: req.app.get('io') });
    } catch (escrowError) {
      console.error('[Escrow] Failed to release payment:', escrowError.message);
    }

    if (project.selectedFreelancer) {
      await Notification.create({
        recipient: project.selectedFreelancer,
        type: 'project_completed',
        title: 'Project Marked as Completed ✅',
        message: `The client has marked "${project.title}" as completed. You can now leave a review.`,
        relatedProject: project._id,
      });

      const ioDone = req.app.get('io');
      if (ioDone) {
        ioDone.to(`user_${project.selectedFreelancer}`).emit('notification', {
          type: 'project_completed',
          projectId: project._id,
          title: 'Project Marked as Completed ✅',
          message: `"${project.title}" has been marked completed.`,
        });
      }
    }

    res.status(200).json({ success: true, message: 'Project marked as completed.', project });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  Request revision on submitted work ────────────────────────────────
// @route PATCH /api/projects/:id/revision
// @access Private – Client (owner)
const requestRevision = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    if (project.status !== 'Submitted') {
      return res.status(400).json({ success: false, message: 'Revisions can only be requested on submitted work.' });
    }

    // Move back to In Progress
    project.status = 'In Progress';

    const { note } = req.body;

    // Track revision cycle so the freelancer can see what to fix
    project.revisions = project.revisions || [];
    project.revisions.push({
      note: (note || '').trim(),
      requestedAt: new Date(),
      respondedAt: null,
    });
    await project.save();

    if (project.selectedFreelancer) {
      await Notification.create({
        recipient: project.selectedFreelancer,
        type: 'revision_requested',
        title: 'Revision Requested 🔄',
        message: note
          ? `The client for "${project.title}" requested a revision: "${note}"`
          : `The client for "${project.title}" requested a revision. Please review and resubmit.`,
        relatedProject: project._id,
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`user_${project.selectedFreelancer}`).emit('notification', {
          type: 'revision_requested',
          projectId: project._id,
          title: 'Revision Requested 🔄',
          message: `Revision requested for "${project.title}".`,
        });
      }
    }

    res.status(200).json({ success: true, message: 'Revision requested. Project moved back to In Progress.', project });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  Get client dashboard stats ───────────────────────────────────────
// @route GET /api/projects/stats/client
// @access Private – Client
const getClientStats = async (req, res, next) => {
  try {
    const clientId = req.user._id;

    const [totalProjects, openProjects, inProgressProjects, completedProjects, cancelledProjects] =
      await Promise.all([
        Project.countDocuments({ client: clientId }),
        Project.countDocuments({ client: clientId, status: 'Open' }),
        Project.countDocuments({ client: clientId, status: 'In Progress' }),
        Project.countDocuments({ client: clientId, status: 'Completed' }),
        Project.countDocuments({ client: clientId, status: 'Cancelled' }),
      ]);

    // Total pending applications across all client projects
    const clientProjectIds = await Project.find({ client: clientId }).distinct('_id');
    const pendingApplications = await Application.countDocuments({
      project: { $in: clientProjectIds },
      status: 'Pending',
    });

    res.status(200).json({
      success: true,
      stats: {
        totalProjects,
        openProjects,
        inProgressProjects,
        completedProjects,
        cancelledProjects,
        pendingApplications,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
