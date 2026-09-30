const Dispute = require('../models/Dispute');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');

// ─── @desc  Raise a dispute on a project ────────────────────────────────────
// @route POST /api/disputes
// @access Private (project participants)
const createDispute = async (req, res, next) => {
  try {
    const { projectId, reason, description } = req.body;

    if (!projectId || !reason || !description) {
      return res.status(400).json({ success: false, message: 'Please provide projectId, reason, and description.' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    // Only the client or the approved freelancer may raise a dispute
    const isClient = project.client.toString() === req.user._id.toString();
    const isFreelancer =
      project.selectedFreelancer &&
      project.selectedFreelancer.toString() === req.user._id.toString();

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ success: false, message: 'Only project participants can raise a dispute.' });
    }

    if (!['In Progress', 'Submitted'].includes(project.status)) {
      return res.status(400).json({
        success: false,
        message: 'Disputes can only be raised while a project is In Progress or Submitted.',
      });
    }

    if (!project.selectedFreelancer) {
      return res.status(400).json({ success: false, message: 'No freelancer is assigned to this project.' });
    }

    // One active dispute per project
    const active = await Dispute.findOne({
      project: project._id,
      status: { $in: ['Open', 'Under Review'] },
    });
    if (active) {
      return res.status(400).json({ success: false, message: 'An active dispute already exists for this project.' });
    }

    const againstUser = isClient ? project.selectedFreelancer : project.client;

    const dispute = await Dispute.create({
      project: project._id,
      raisedBy: req.user._id,
      againstUser,
      reason: reason.trim(),
      description: description.trim(),
      history: [{ status: 'Open', note: 'Dispute raised by participant.', changedBy: req.user._id }],
    });

    // Notify all admins so they can pick it up
    const admins = await User.find({ role: 'Admin', isActive: { $ne: false } }).select('_id');
    const io = req.app.get('io');
    for (const admin of admins) {
      await Notification.create({
        recipient: admin._id,
        type: 'dispute_created',
        title: 'New Dispute Raised ⚠️',
        message: `${req.user.name} raised a dispute "${dispute.reason}" on "${project.title}".`,
        relatedProject: project._id,
      });
      if (io) {
        io.to(`user_${admin._id}`).emit('notification', {
          type: 'dispute_created',
          projectId: project._id,
          title: 'New Dispute Raised ⚠️',
          message: `${req.user.name} raised a dispute on "${project.title}".`,
        });
      }
    }

    // Notify the other party
    await Notification.create({
      recipient: againstUser,
      type: 'dispute_created',
      title: 'A Dispute Has Been Filed ⚠️',
      message: `${req.user.name} raised a dispute on "${project.title}": ${dispute.reason}`,
      relatedProject: project._id,
    });
    if (io) {
      io.to(`user_${againstUser}`).emit('notification', {
        type: 'dispute_created',
        projectId: project._id,
        title: 'A Dispute Has Been Filed ⚠️',
        message: `${req.user.name} raised a dispute on "${project.title}".`,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Dispute raised. Our team will review it shortly.',
      dispute,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  Get disputes the logged-in user is involved in ──────────────────
// @route GET /api/disputes/mine
// @access Private
const getMyDisputes = async (req, res, next) => {
  try {
    const filter = {
      $or: [{ raisedBy: req.user._id }, { againstUser: req.user._id }],
    };
    if (req.query.projectId) filter.project = req.query.projectId;

    const disputes = await Dispute.find(filter)
      .populate('project', 'title status')
      .populate('raisedBy', 'name role')
      .populate('againstUser', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: disputes.length, disputes });
  } catch (error) {
    next(error);
  }
};

module.exports = { createDispute, getMyDisputes };
