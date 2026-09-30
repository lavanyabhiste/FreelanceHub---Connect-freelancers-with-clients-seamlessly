const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: [true, 'Message must belong to a chat session'],
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Message must have a sender'],
      index: true,
    },
    message: {
      type: String,
      default: '',
      trim: true,
      maxlength: [4000, 'Message cannot exceed 4000 characters'],
    },
    attachments: [
      {
        url: { type: String, required: true },
        filename: { type: String },
        fileType: { type: String },
        fileSize: { type: Number },
      },
    ],
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for chronological message streaming and unread message querying
messageSchema.index({ chat: 1, createdAt: 1 });
messageSchema.index({ chat: 1, read: 1 });
messageSchema.index({ sender: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
