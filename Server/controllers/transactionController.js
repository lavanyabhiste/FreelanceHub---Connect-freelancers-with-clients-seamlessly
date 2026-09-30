const Transaction = require('../models/Transaction');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const { getPaymentProvider } = require('../services/paymentService');

// ─── Helpers (used by projectController to wire escrow into the workflow) ────

/**
 * Create a Pending escrow transaction when a client approves a freelancer.
 * Uses the mock payment provider; a real gateway can be swapped in later.
 */
const createEscrowTransaction = async ({ project, amount, io }) => {
  const existing = await Transaction.findOne({ project: project._id, status: { $ne: 'Failed' } });
  if (existing) return existing;

  const provider = getPaymentProvider();
  const charge = await provider.charge({
    amount,
    currency: 'USD',
    metadata: { projectId: project._id.toString(), clientId: project.client.toString() },
  });

  const transaction = await Transaction.create({
    project: project._id,
    client: project.client,
    freelancer: project.selectedFreelancer,
    amount,
    status: charge.ok ? 'Pending' : 'Failed',
    provider: provider.name,
    currency: 'USD',
    gatewayId: charge.gatewayId || null,
    failureReason: charge.ok ? null : (charge.failureReason || 'Payment declined.'),
    meta: { createdAtStep: 'approval' },
  });

  if (io && transaction.status === 'Pending') {
    io.to(`user_${project.selectedFreelancer}`).emit('notification', {
      type: 'payment_escrowed',
      projectId: project._id,
      title: 'Payment Secured in Escrow 💰',
      message: `$${amount} for "${project.title}" is now held in escrow.`,
    });
  }

  return transaction;
};

/**
 * Release the project's escrow transaction to the freelancer (Pending → Completed).
 * Called automatically when the client marks a project completed.
 */
const releaseEscrowForProject = async ({ project, io }) => {
  const transaction = await Transaction.findOne({ project: project._id, status: 'Pending' });
  if (!transaction) return null;

  const provider = getPaymentProvider();
  const result = await provider.release({ gatewayId: transaction.gatewayId, amount: transaction.amount });

  if (!result.ok) {
    transaction.failureReason = result.failureReason || 'Release failed.';
    await transaction.save();
    return transaction;
  }

  transaction.status = 'Completed';
  transaction.gatewayId = result.gatewayId;
  transaction.releasedAt = new Date();
  await transaction.save();

  await Notification.create({
    recipient: transaction.freelancer,
    type: 'payment_released',
    title: 'Payment Released 💰',
    message: `$${transaction.amount} for "${project.title}" has been released to you.`,
    relatedProject: project._id,
  });

  if (io) {
    io.to(`user_${transaction.freelancer}`).emit('notification', {
      type: 'payment_released',
      projectId: project._id,
      title: 'Payment Released 💰',
      message: `$${transaction.amount} for "${project.title}" has been released.`,
    });
  }

  return transaction;
};

// ─── @desc  Get my transactions (client or freelancer view) ─────────────────
// @route GET /api/transactions
// @access Private
const getMyTransactions = async (req, res, next) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    const filter = { };
    if (req.user.role === 'Freelancer') filter.freelancer = req.user._id;
    else filter.client = req.user._id;
    if (status) filter.status = status;

    const [transactions, total, pending, completed, refunded, failed] = await Promise.all([
      Transaction.find(filter)
        .populate('project', 'title status')
        .populate('client', 'name')
        .populate('freelancer', 'name')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit)),
      Transaction.countDocuments(filter),
      Transaction.countDocuments({ ...filter, status: 'Pending' }),
      Transaction.countDocuments({ ...filter, status: 'Completed' }),
      Transaction.countDocuments({ ...filter, status: 'Refunded' }),
      Transaction.countDocuments({ ...filter, status: 'Failed' }),
    ]);

    res.status(200).json({
      success: true,
      transactions,
      total,
      page: Number(page),
      totalPages: Math.max(1, Math.ceil(total / Number(limit))),
      summary: { pending, completed, refunded, failed },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  Get transaction for a specific project ──────────────────────────
// @route GET /api/transactions/project/:projectId
// @access Private (project participants only)
const getProjectTransaction = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    const isClient = project.client.toString() === req.user._id.toString();
    const isFreelancer =
      project.selectedFreelancer &&
      project.selectedFreelancer.toString() === req.user._id.toString();
    if (!isClient && !isFreelancer) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this transaction.' });
    }

    const transaction = await Transaction.findOne({ project: project._id })
      .populate('client', 'name')
      .populate('freelancer', 'name');

    res.status(200).json({ success: true, transaction: transaction || null });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  Manually release escrow (fallback if auto-release failed) ───────
// @route POST /api/transactions/:id/release
// @access Private – Client (owner)
const releaseTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found.' });

    if (transaction.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the client can release funds.' });
    }
    if (transaction.status !== 'Pending') {
      return res.status(400).json({ success: false, message: `Cannot release a ${transaction.status} transaction.` });
    }

    const project = await Project.findById(transaction.project);
    if (!project || project.status !== 'Completed') {
      return res.status(400).json({ success: false, message: 'Funds can only be released for completed projects.' });
    }

    const provider = getPaymentProvider();
    const result = await provider.release({ gatewayId: transaction.gatewayId, amount: transaction.amount });
    if (!result.ok) {
      transaction.failureReason = result.failureReason || 'Release failed.';
      await transaction.save();
      return res.status(502).json({ success: false, message: transaction.failureReason });
    }

    transaction.status = 'Completed';
    transaction.gatewayId = result.gatewayId;
    transaction.releasedAt = new Date();
    transaction.failureReason = null;
    await transaction.save();

    res.status(200).json({ success: true, message: 'Funds released to freelancer.', transaction });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  Refund escrow back to the client ────────────────────────────────
// @route POST /api/transactions/:id/refund
// @access Private – Client (owner)
const refundTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found.' });

    if (transaction.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the client can request a refund.' });
    }
    if (transaction.status !== 'Pending') {
      return res.status(400).json({ success: false, message: `Cannot refund a ${transaction.status} transaction.` });
    }

    const project = await Project.findById(transaction.project);
    if (project && project.status === 'Completed') {
      return res.status(400).json({ success: false, message: 'Completed projects cannot be refunded.' });
    }

    const provider = getPaymentProvider();
    const result = await provider.refund({ gatewayId: transaction.gatewayId, amount: transaction.amount });
    if (!result.ok) {
      transaction.failureReason = result.failureReason || 'Refund failed.';
      await transaction.save();
      return res.status(502).json({ success: false, message: transaction.failureReason });
    }

    transaction.status = 'Refunded';
    transaction.gatewayId = result.gatewayId;
    transaction.refundedAt = new Date();
    transaction.failureReason = null;
    await transaction.save();

    if (project && project.selectedFreelancer) {
      await Notification.create({
        recipient: project.selectedFreelancer,
        type: 'payment_refunded',
        title: 'Escrow Refunded 💸',
        message: `The escrow payment for "${project.title}" was refunded to the client.`,
        relatedProject: project._id,
      });
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${project.selectedFreelancer}`).emit('notification', {
          type: 'payment_refunded',
          projectId: project._id,
          title: 'Escrow Refunded 💸',
          message: `The escrow payment for "${project.title}" was refunded to the client.`,
        });
      }
    }

    res.status(200).json({ success: true, message: 'Transaction refunded.', transaction });
  } catch (error) {
    next(error);
  }
};

// ─── @desc  Simulate a payment failure (mock gateway testing) ───────────────
// @route POST /api/transactions/:id/fail
// @access Private – Client (owner)
const failTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found.' });

    if (transaction.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    if (transaction.status !== 'Pending') {
      return res.status(400).json({ success: false, message: `Cannot fail a ${transaction.status} transaction.` });
    }

    transaction.status = 'Failed';
    transaction.failureReason = req.body.reason || 'Simulated gateway failure.';
    await transaction.save();

    res.status(200).json({ success: true, message: 'Transaction marked as failed.', transaction });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEscrowTransaction,
  releaseEscrowForProject,
  getMyTransactions,
  getProjectTransaction,
  releaseTransaction,
  refundTransaction,
  failTransaction,
};
