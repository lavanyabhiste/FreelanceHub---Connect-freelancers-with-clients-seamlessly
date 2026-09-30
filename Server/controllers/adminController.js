const User = require('../models/User');
const Project = require('../models/Project');
const Application = require('../models/Application');
const Transaction = require('../models/Transaction');
const Dispute = require('../models/Dispute');
const Review = require('../models/Review');

// ─── @desc  Platform statistics for the admin dashboard ─────────────────────
// @route GET /api/admin/stats
// @access Private – Admin
const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalUsers, totalClients, totalFreelancers, totalAdmins,
      verifiedUsers, activeUsers, inactiveUsers,
      totalProjects, openProjects, activeProjects, submittedProjects, completedProjects, cancelledProjects,
      totalApplications, pendingApplications, approvedApplications, rejectedApplications,
      totalTransactions, pendingTxns, completedTxns, failedTxns, refundedTxns,
      totalDisputes, openDisputes, reviewDisputes, resolvedDisputes, closedDisputes,
      totalReviews,
      volumeAgg, escrowAgg,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'Client' }),
      User.countDocuments({ role: 'Freelancer' }),
      User.countDocuments({ role: 'Admin' }),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ isActive: { $ne: false } }),
      User.countDocuments({ isActive: false }),

      Project.countDocuments({}),
      Project.countDocuments({ status: 'Open' }),
      Project.countDocuments({ status: 'In Progress' }),
      Project.countDocuments({ status: 'Submitted' }),
      Project.countDocuments({ status: 'Completed' }),
      Project.countDocuments({ status: 'Cancelled' }),

      Application.countDocuments({}),
      Application.countDocuments({ status: 'Pending' }),
      Application.countDocuments({ status: 'Approved' }),
      Application.countDocuments({ status: 'Rejected' }),

      Transaction.countDocuments({}),
      Transaction.countDocuments({ status: 'Pending' }),
      Transaction.countDocuments({ status: 'Completed' }),
      Transaction.countDocuments({ status: 'Failed' }),
      Transaction.countDocuments({ status: 'Refunded' }),

      Dispute.countDocuments({}),
      Dispute.countDocuments({ status: 'Open' }),
      Dispute.countDocuments({ status: 'Under Review' }),
      Dispute.countDocuments({ status: 'Resolved' }),
      Dispute.countDocuments({ status: 'Closed' }),

      Review.countDocuments({}),
      Transaction.aggregate([
        { $match: { status: 'Completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { status: 'Pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          clients: totalClients,
          freelancers: totalFreelancers,
          admins: totalAdmins,
          verified: verifiedUsers,
          active: activeUsers,
          inactive: inactiveUsers,
        },
        projects: {
          total: totalProjects,
          open: openProjects,
          active: activeProjects,
          submitted: submittedProjects,
          completed: completedProjects,
          cancelled: cancelledProjects,
        },
        applications: {
          total: totalApplications,
          pending: pendingApplications,
          approved: approvedApplications,
          rejected: rejectedApplications,
        },
        transactions: {
          total: totalTransactions,
          pending: pendingTxns,
          completed: completedTxns,
          failed: failedTxns,
          refunded: refundedTxns,
          volume: volumeAgg[0]?.total || 0,
          escrowed: escrowAgg[0]?.total || 0,
        },
        disputes: {
          total: totalDisputes,
          open: openDisputes,
          underReview: reviewDisputes,
          resolved: resolvedDisputes,
          closed: closedDisputes,
          pending: openDisputes + reviewDisputes,
        },
        reviews: totalReviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  List all users (manage clients & freelancers) ───────────────────
// @route GET /api/admin/users
// @access Private – Admin
const getUsers = async (req, res, next) => {
  try {
    const { role, status, verified, search, limit = 20, page = 1 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status === 'active') filter.isActive = { $ne: false };
    if (status === 'inactive') filter.isActive = false;
    if (verified === 'true') filter.isVerified = true;
    if (verified === 'false') filter.isVerified = false;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit)),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      users,
      total,
      page: Number(page),
      totalPages: Math.max(1, Math.ceil(total / Number(limit))),
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  Verify or unverify a user ───────────────────────────────────────
// @route PATCH /api/admin/users/:id/verify
// @access Private – Admin
const verifyUser = async (req, res, next) => {
  try {
    const { isVerified } = req.body;
    if (typeof isVerified !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isVerified must be a boolean.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.isVerified = isVerified;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${isVerified ? 'verified' : 'unverified'} successfully.`,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified, isActive: user.isActive },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  Activate or deactivate a user ───────────────────────────────────
// @route PATCH /api/admin/users/:id/status
// @access Private – Admin
const setUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be a boolean.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' });
    }

    if (user.role === 'Admin') {
      return res.status(400).json({ success: false, message: 'Admin accounts cannot be deactivated from the dashboard.' });
    }

    user.isActive = isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Account ${isActive ? 'activated' : 'deactivated'} successfully.`,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified, isActive: user.isActive },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  List all projects (moderation view) ─────────────────────────────
// @route GET /api/admin/projects
// @access Private – Admin
const getProjects = async (req, res, next) => {
  try {
    const { status, search, limit = 20, page = 1 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('client', 'name email')
        .populate('selectedFreelancer', 'name email')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit)),
      Project.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      projects,
      total,
      page: Number(page),
      totalPages: Math.max(1, Math.ceil(total / Number(limit))),
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  Moderate a project status (Open ↔ Cancelled) ────────────────────
// @route PATCH /api/admin/projects/:id/status
// @access Private – Admin
const moderateProject = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['Open', 'Cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Moderation allows only 'Open' (restore) or 'Cancelled' (suspend).",
      });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    // Active projects (with work in flight) and completed ones are protected —
    // conflicts between parties must go through the dispute process instead.
    if (['In Progress', 'Submitted'].includes(project.status)) {
      return res.status(400).json({
        success: false,
        message: 'Active projects cannot be moderated directly. Use the dispute process to intervene.',
      });
    }
    if (project.status === 'Completed') {
      return res.status(400).json({ success: false, message: 'Completed projects cannot be moderated.' });
    }

    project.status = status;
    await project.save();

    res.status(200).json({
      success: true,
      message: `Project ${status === 'Cancelled' ? 'suspended' : 'restored'} successfully.`,
      project: { _id: project._id, title: project.title, status: project.status },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  Delete a project (severe moderation) ────────────────────────────
// @route DELETE /api/admin/projects/:id
// @access Private – Admin
const deleteProjectByAdmin = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    if (project.status === 'In Progress' || project.status === 'Submitted') {
      return res.status(400).json({
        success: false,
        message: 'Active projects must be handled through a dispute or cancellation first.',
      });
    }

    await Project.deleteOne({ _id: project._id });
    res.status(200).json({ success: true, message: 'Project deleted.', project: { _id: project._id, title: project.title } });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  Monitor all applications ────────────────────────────────────────
// @route GET /api/admin/applications
// @access Private – Admin
const getApplications = async (req, res, next) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate({ path: 'project', select: 'title status client', populate: { path: 'client', select: 'name email' } })
        .populate('freelancer', 'name email rating')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit)),
      Application.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      applications,
      total,
      page: Number(page),
      totalPages: Math.max(1, Math.ceil(total / Number(limit))),
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  View all transactions ───────────────────────────────────────────
// @route GET /api/admin/transactions
// @access Private – Admin
const getTransactions = async (req, res, next) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const [transactions, total, pending, completed, failed, refunded] = await Promise.all([
      Transaction.find(filter)
        .populate('project', 'title status')
        .populate('client', 'name email')
        .populate('freelancer', 'name email')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit)),
      Transaction.countDocuments(filter),
      Transaction.countDocuments({ status: 'Pending' }),
      Transaction.countDocuments({ status: 'Completed' }),
      Transaction.countDocuments({ status: 'Failed' }),
      Transaction.countDocuments({ status: 'Refunded' }),
    ]);

    res.status(200).json({
      success: true,
      transactions,
      total,
      page: Number(page),
      totalPages: Math.max(1, Math.ceil(total / Number(limit))),
      summary: { pending, completed, failed, refunded },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  List all disputes ───────────────────────────────────────────────
// @route GET /api/admin/disputes
// @access Private – Admin
const getDisputes = async (req, res, next) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const [disputes, total, open, underReview, resolved, closed] = await Promise.all([
      Dispute.find(filter)
        .populate('project', 'title status budget')
        .populate('raisedBy', 'name email role')
        .populate('againstUser', 'name email role')
        .populate('history.changedBy', 'name role')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit)),
      Dispute.countDocuments(filter),
      Dispute.countDocuments({ status: 'Open' }),
      Dispute.countDocuments({ status: 'Under Review' }),
      Dispute.countDocuments({ status: 'Resolved' }),
      Dispute.countDocuments({ status: 'Closed' }),
    ]);

    res.status(200).json({
      success: true,
      disputes,
      total,
      page: Number(page),
      totalPages: Math.max(1, Math.ceil(total / Number(limit))),
      summary: { open, underReview, resolved, closed, pending: open + underReview },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  Advance a dispute through its lifecycle ─────────────────────────
// @route PATCH /api/admin/disputes/:id
// @access Private – Admin
const updateDispute = async (req, res, next) => {
  try {
    const { status, note, resolution } = req.body;
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found.' });

    if (!status) {
      // Allow note/resolution updates without a status change
      if (typeof note === 'string') dispute.adminNote = note;
      if (typeof resolution === 'string') dispute.resolution = resolution;
      await dispute.save();
      return res.status(200).json({ success: true, message: 'Dispute updated.', dispute });
    }

    const valid = Dispute.isValidTransition(dispute.status, status);
    if (!valid) {
      const allowed = Dispute.ALLOWED_TRANSITIONS[dispute.status] || [];
      return res.status(400).json({
        success: false,
        message: allowed.length
          ? `Cannot move a dispute from '${dispute.status}' to '${status}'. Allowed: ${allowed.join(', ')}.`
          : `A '${dispute.status}' dispute cannot be moved to '${status}'.`,
      });
    }

    dispute.history.push({
      status,
      note: (note || '').trim(),
      changedBy: req.user._id,
      changedAt: new Date(),
    });
    dispute.status = status;
    if (typeof note === 'string') dispute.adminNote = note;
    if (typeof resolution === 'string') dispute.resolution = resolution;
    if (status === 'Resolved') dispute.resolvedAt = new Date();
    if (status === 'Closed') dispute.closedAt = new Date();
    await dispute.save();

    // Notify both parties of the status change
    const Notification = require('../models/Notification');
    const io = req.app.get('io');
    const titleMap = {
      'Under Review': 'Dispute Under Review 🔍',
      Resolved: 'Dispute Resolved ✅',
      Closed: 'Dispute Closed 🔒',
    };
    const message = `Dispute for "${dispute.reason}" is now ${status}.${resolution ? ` Resolution: ${resolution}` : ''}`;

    for (const recipient of [dispute.raisedBy, dispute.againstUser]) {
      await Notification.create({
        recipient,
        type: 'dispute_updated',
        title: titleMap[status] || 'Dispute Updated',
        message,
        relatedProject: dispute.project,
      });
      if (io) {
        io.to(`user_${recipient}`).emit('notification', {
          type: 'dispute_updated',
          projectId: dispute.project,
          title: titleMap[status] || 'Dispute Updated',
          message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Dispute moved to '${status}'.`,
      dispute,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
