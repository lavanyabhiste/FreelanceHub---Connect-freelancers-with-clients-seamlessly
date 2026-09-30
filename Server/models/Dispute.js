const mongoose = require('mongoose');

/**
 * Dispute lifecycle: Open → Under Review → Resolved → Closed
 */
const STATUSES = ['Open', 'Under Review', 'Resolved', 'Closed'];

const disputeSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Dispute must be linked to a project'],
      index: true,
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Dispute must record who raised it'],
      index: true,
    },
    againstUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Dispute must record the other party'],
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Please provide a dispute reason'],
      trim: true,
      maxlength: [150, 'Reason cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please describe the dispute'],
      trim: true,
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: STATUSES,
        message: '{VALUE} is not a valid dispute status',
      },
      default: 'Open',
      index: true,
    },
    // Admin-managed resolution details
    adminNote: {
      type: String,
      default: '',
      maxlength: [3000, 'Admin note cannot exceed 3000 characters'],
    },
    resolution: {
      type: String,
      default: '',
      maxlength: [3000, 'Resolution cannot exceed 3000 characters'],
    },
    // Status transition audit trail
    history: [
      {
        status: { type: String, enum: STATUSES },
        note: { type: String, default: '' },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
      },
    ],
    openedAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Performance indexes for admin listing + status filters
disputeSchema.index({ status: 1, createdAt: -1 });
disputeSchema.index({ project: 1, status: 1 });

// Allowed transitions: Open → Under Review → Resolved → Closed
disputeSchema.statics.ALLOWED_TRANSITIONS = {
  Open: ['Under Review'],
  'Under Review': ['Resolved'],
  Resolved: ['Closed'],
  Closed: [],
};

disputeSchema.statics.isValidTransition = function (from, to) {
  return (this.ALLOWED_TRANSITIONS[from] || []).includes(to);
};

const Dispute = mongoose.model('Dispute', disputeSchema);

module.exports = Dispute;
