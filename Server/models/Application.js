const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'An application must be linked to a project'],
      index: true,
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'An application must belong to a freelancer'],
      index: true,
    },
    proposal: {
      type: String,
      required: [true, 'Please provide a proposal pitch'],
      trim: true,
      maxlength: [3000, 'Proposal cannot exceed 3000 characters'],
    },
    bidAmount: {
      type: Number,
      required: [true, 'Please provide a bid amount'],
      min: [1, 'Bid amount must be at least 1'],
    },
    estimatedDuration: {
      type: String,
      required: [true, 'Please provide an estimated duration to complete'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Approved', 'Rejected'],
        message: '{VALUE} is not a valid application status',
      },
      default: 'Pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent a freelancer from applying more than once to the same project
applicationSchema.index({ project: 1, freelancer: 1 }, { unique: true });

// Performance indexes for querying applications
applicationSchema.index({ project: 1, status: 1 });
applicationSchema.index({ freelancer: 1, status: 1 });
applicationSchema.index({ createdAt: -1 });

// Ensure only one freelancer can be approved for a project
// (promise-style hook — Mongoose 7+ does not pass `next` to async hooks)
applicationSchema.pre('save', async function () {
  if (this.isModified('status') && this.status === 'Approved') {
    const existingApproved = await this.constructor.findOne({
      project: this.project,
      status: 'Approved',
      _id: { $ne: this._id },
    });

    if (existingApproved) {
      throw new Error('Another freelancer is already approved for this project');
    }
  }
});

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
