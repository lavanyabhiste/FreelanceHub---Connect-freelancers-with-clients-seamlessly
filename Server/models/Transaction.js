const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Transaction must be associated with a project'],
      index: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Transaction must be linked to a client'],
      index: true,
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Transaction must be linked to a freelancer'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
      min: [1, 'Amount must be greater than 0'],
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Completed', 'Failed', 'Refunded'],
        message: '{VALUE} is not a valid transaction status',
      },
      default: 'Pending',
      index: true,
    },
    paymentReference: {
      type: String,
      default: () => `MOCK_TXN_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      trim: true,
    },
    // ── Future payment-gateway integration points ────────────────────────────
    // Swap 'mock' for 'stripe' / 'paypal' once a real gateway is integrated.
    provider: {
      type: String,
      enum: ['mock', 'stripe', 'paypal'],
      default: 'mock',
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    // Gateway-side identifier (e.g. Stripe charge/pi id) — set on release/refund
    gatewayId: {
      type: String,
      default: null,
    },
    failureReason: {
      type: String,
      default: null,
    },
    releasedAt: {
      type: Date,
      default: null,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Performance indexes for transaction history lookups
transactionSchema.index({ client: 1, createdAt: -1 });
transactionSchema.index({ freelancer: 1, createdAt: -1 });
transactionSchema.index({ project: 1, status: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
