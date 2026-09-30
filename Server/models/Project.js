const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A project must belong to a client'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a project title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a detailed project description'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Please select a project category'],
      trim: true,
      index: true,
    },
    requiredSkills: {
      type: [String],
      default: [],
      index: true,
    },
    budget: {
      type: Number,
      required: [true, 'Please specify the project budget'],
      min: [1, 'Budget must be at least 1'],
    },
    duration: {
      type: String,
      required: [true, 'Please specify the estimated duration'],
      trim: true,
    },
    deadline: {
      type: Date,
    },
    status: {
      type: String,
      enum: {
        values: ['Open', 'In Progress', 'Submitted', 'Completed', 'Cancelled'],
        message: '{VALUE} is not a valid project status',
      },
      default: 'Open',
      index: true,
    },
    selectedFreelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    submission: {
      projectLink: { type: String, default: '' },
      description: { type: String, default: '' },
      files: [
        {
          url: { type: String },
          filename: { type: String },
          fileType: { type: String },
          fileSize: { type: Number },
        },
      ],
      submittedAt: { type: Date },
    },
    // Revision cycle history: client requests → freelancer responds (resubmits)
    revisions: [
      {
        note: { type: String, default: '' },
        requestedAt: { type: Date, default: Date.now },
        respondedAt: { type: Date, default: null },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for searching and filtering projects
projectSchema.index({ title: 'text', description: 'text', category: 'text' });
projectSchema.index({ status: 1, createdAt: -1 });
projectSchema.index({ category: 1, status: 1 });
projectSchema.index({ client: 1, status: 1 });

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
