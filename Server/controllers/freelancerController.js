const User = require('../models/User');
const Project = require('../models/Project');
const Application = require('../models/Application');
const Notification = require('../models/Notification');

// ─── @desc  Update freelancer profile ─────────────────────────────────────────
// @route PUT /api/freelancers/profile
// @access Private – Freelancer
const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, skills, portfolio, experience, profileImage } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name !== undefined) user.name = name.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (skills !== undefined) {
      user.skills = Array.isArray(skills)
        ? skills.map((s) => s.trim()).filter(Boolean)
        : skills.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (portfolio !== undefined) user.portfolio = portfolio;
    if (experience !== undefined) user.experience = experience.trim();
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save();

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      bio: user.bio,
      skills: user.skills,
      portfolio: user.portfolio,
      experience: user.experience,
      rating: user.rating,
      totalReviews: user.totalReviews,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };

    res.status(200).json({ success: true, message: 'Profile updated successfully.', user: userResponse });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  Get all applications for logged-in freelancer ─────────────────────
// @route GET /api/freelancers/applications
// @access Private – Freelancer
const getMyApplications = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { freelancer: req.user._id };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [applications, total] = await Promise.all([
      Application.find(filter)
        .populate('project', 'title description category budget duration deadline status client selectedFreelancer')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Application.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: applications.length,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      applications,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  Submit a bid/proposal on a project ────────────────────────────────
// @route POST /api/freelancers/bid
// @access Private – Freelancer
const submitBid = async (req, res, next) => {
  try {
    const { projectId, proposal, bidAmount, estimatedDuration } = req.body;

    if (!projectId || !proposal || !bidAmount || !estimatedDuration) {
      return res.status(400).json({
        success: false,
        message: 'Please provide projectId, proposal, bidAmount, and estimatedDuration.',
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (project.status !== 'Open') {
      return res.status(400).json({
        success: false,
        message: 'This project is no longer accepting proposals.',
      });
    }

    // Prevent duplicate applications
    const existingApplication = await Application.findOne({
      project: projectId,
      freelancer: req.user._id,
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a proposal for this project.',
      });
    }

    const application = await Application.create({
      project: projectId,
      freelancer: req.user._id,
      proposal: proposal.trim(),
      bidAmount: Number(bidAmount),
      estimatedDuration: estimatedDuration.trim(),
      status: 'Pending',
    });

    // Notify client about new bid
    await Notification.create({
      recipient: project.client,
      type: 'new_bid',
      title: 'New Proposal Received 📨',
      message: `${req.user.name} has submitted a proposal for "${project.title}".`,
      relatedProject: project._id,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${project.client}`).emit('notification', {
        type: 'new_bid',
        projectId: project._id,
        title: 'New Proposal Received 📨',
        message: `${req.user.name} submitted a proposal for "${project.title}".`,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Proposal submitted successfully.',
      application,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  Submit completed work for a project ────────────────────────────────
// @route POST /api/freelancers/submit-work
// @access Private – Freelancer (approved for project)
const submitWork = async (req, res, next) => {
  try {
    const { projectId, projectLink, description, files } = req.body;

    if (!projectId || !projectLink || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide projectId, projectLink, and description.',
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Verify freelancer is approved for this project
    if (!project.selectedFreelancer || project.selectedFreelancer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not approved for this project.',
      });
    }

    if (project.status !== 'In Progress') {
      return res.status(400).json({
        success: false,
        message: 'Work can only be submitted while the project is In Progress.',
      });
    }

    // Update project with submission
    project.submission = {
      projectLink: projectLink.trim(),
      description: description.trim(),
      files: files || [],
      submittedAt: new Date(),
    };

    // If this is a resubmission after a revision request, mark it as responded
    if (project.revisions?.length > 0) {
      const lastRevision = project.revisions[project.revisions.length - 1];
      if (lastRevision && !lastRevision.respondedAt) {
        lastRevision.respondedAt = new Date();
      }
    }

    project.status = 'Submitted';
    await project.save();

    // Notify client
    await Notification.create({
      recipient: project.client,
      type: 'work_submitted',
      title: 'Work Submitted 🎉',
      message: `${req.user.name} has submitted work for "${project.title}". Please review and mark as complete.`,
      relatedProject: project._id,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${project.client}`).emit('notification', {
        type: 'work_submitted',
        projectId: project._id,
        title: 'Work Submitted 🎉',
        message: `${req.user.name} submitted work for "${project.title}".`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Work submitted successfully. The project is now in Submitted status.',
      project,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  Get freelancer dashboard stats ────────────────────────────────────
// @route GET /api/freelancers/stats
// @access Private – Freelancer
const getFreelancerStats = async (req, res, next) => {
  try {
    const freelancerId = req.user._id;

    const [totalApplications, pendingApplications, approvedApplications, rejectedApplications] =
      await Promise.all([
        Application.countDocuments({ freelancer: freelancerId }),
        Application.countDocuments({ freelancer: freelancerId, status: 'Pending' }),
        Application.countDocuments({ freelancer: freelancerId, status: 'Approved' }),
        Application.countDocuments({ freelancer: freelancerId, status: 'Rejected' }),
      ]);

    // Active projects (approved + In Progress)
    const activeProjects = await Project.countDocuments({
      selectedFreelancer: freelancerId,
      status: 'In Progress',
    });

    // Completed projects
    const completedProjects = await Project.countDocuments({
      selectedFreelancer: freelancerId,
      status: 'Completed',
    });

    // Submitted projects (awaiting client review)
    const submittedProjects = await Project.countDocuments({
      selectedFreelancer: freelancerId,
      status: 'Submitted',
    });

    res.status(200).json({
      success: true,
      stats: {
        totalApplications,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        activeProjects,
        completedProjects,
        submittedProjects,
        rating: req.user.rating || 0,
        totalReviews: req.user.totalReviews || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  Get projects where freelancer is approved (active + completed) ───
// @route GET /api/freelancers/my-projects
// @access Private – Freelancer
const getMyFreelancerProjects = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { selectedFreelancer: req.user._id };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('client', 'name email profileImage rating')
        .sort({ updatedAt: -1 })
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

module.exports = {
  updateProfile,
  getMyApplications,
  submitBid,
  submitWork,
  getFreelancerStats,
  getMyFreelancerProjects,
};
