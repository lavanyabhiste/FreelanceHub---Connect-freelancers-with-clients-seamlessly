const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * @desc    Get all chats for the logged-in user
 * @route   GET /api/chats
 * @access  Private
 */
const getMyChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('project', 'title status')
      .populate('client', 'name email profileImage')
      .populate('freelancer', 'name email profileImage')
      .sort({ updatedAt: -1 });

    // Attach last message to each chat
    const chatsWithLastMessage = await Promise.all(
      chats.map(async (chat) => {
        const lastMessage = await Message.findOne({ chat: chat._id })
          .sort({ createdAt: -1 })
          .populate('sender', 'name');
        return { ...chat.toObject(), lastMessage };
      })
    );

    res.status(200).json({ success: true, count: chatsWithLastMessage.length, chats: chatsWithLastMessage });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get or create a chat for a project between client and freelancer
 * @route   GET /api/chats/project/:projectId
 * @access  Private
 */
const getOrCreateProjectChat = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Authorization: must be client or selected freelancer
    const isClient = project.client.toString() === req.user._id.toString();
    const isFreelancer =
      project.selectedFreelancer &&
      project.selectedFreelancer.toString() === req.user._id.toString();

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this chat.' });
    }

    if (!project.selectedFreelancer) {
      return res.status(400).json({ success: false, message: 'No freelancer has been approved for this project yet.' });
    }

    // Find existing chat
    let chat = await Chat.findOne({
      project: project._id,
      client: project.client,
      freelancer: project.selectedFreelancer,
    });

    // Create if doesn't exist
    if (!chat) {
      chat = await Chat.create({
        project: project._id,
        client: project.client,
        freelancer: project.selectedFreelancer,
        participants: [project.client, project.selectedFreelancer],
      });
    }

    const populatedChat = await Chat.findById(chat._id)
      .populate('project', 'title status')
      .populate('client', 'name email profileImage')
      .populate('freelancer', 'name email profileImage');

    res.status(200).json({ success: true, chat: populatedChat });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get messages for a chat
 * @route   GET /api/chats/:chatId/messages
 * @access  Private
 */
const getChatMessages = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found.' });
    }

    // Authorization: must be a participant
    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this chat.' });
    }

    // Paginated history: page 1 returns the most recent window (ascending for
    // display); higher pages walk backwards through older messages.
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 200);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const total = await Message.countDocuments({ chat: req.params.chatId });
    const skip = Math.max(total - limit * page, 0);

    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'name profileImage')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: messages.length,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      currentPage: page,
      messages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send a message in a chat
 * @route   POST /api/chats/:chatId/messages
 * @access  Private
 */
const sendMessage = async (req, res, next) => {
  try {
    const { message, attachments } = req.body;

    const hasText = message && message.trim();
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

    if (!hasText && !hasAttachments) {
      return res.status(400).json({
        success: false,
        message: 'Message content or at least one attachment is required.',
      });
    }

    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found.' });
    }

    // Authorization: must be a participant
    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to send messages in this chat.' });
    }

    // Validate attachments
    const safeAttachments = [];
    if (hasAttachments) {
      const ALLOWED_TYPES = [
        'image/png', 'image/jpeg', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'text/csv',
        'application/zip', 'application/x-rar-compressed',
      ];
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB

      for (const att of attachments) {
        if (!att.url) continue;
        if (att.fileType && !ALLOWED_TYPES.includes(att.fileType)) {
          return res.status(400).json({
            success: false,
            message: `File type '${att.fileType}' is not supported.`,
          });
        }
        if (att.fileSize && att.fileSize > MAX_SIZE) {
          return res.status(400).json({
            success: false,
            message: 'File size cannot exceed 10MB.',
          });
        }
        safeAttachments.push({
          url: att.url,
          filename: att.filename || 'file',
          fileType: att.fileType || 'application/octet-stream',
          fileSize: att.fileSize || 0,
        });
      }
    }

    const newMessage = await Message.create({
      chat: chat._id,
      sender: req.user._id,
      message: hasText ? message.trim() : '',
      attachments: safeAttachments,
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'name profileImage');

    // Update chat's updatedAt for sorting
    await Chat.findByIdAndUpdate(chat._id, { updatedAt: new Date() });

    // Persist a notification for the other participant
    const otherUser = chat.participants.find(
      (p) => p.toString() !== req.user._id.toString()
    );
    if (otherUser) {
      await Notification.create({
        recipient: otherUser,
        type: 'new_message',
        title: `New message from ${req.user.name}`,
        message: hasText
          ? message.trim().slice(0, 200)
          : `Sent ${safeAttachments.length} attachment(s)`,
        relatedProject: chat.project,
      });
    }

    // Emit real-time message via Socket.IO to everyone in the chat room
    const io = req.app.get('io');
    if (io) {
      io.to(`chat_${chat._id}`).emit('new_message', {
        chatId: chat._id,
        message: populatedMessage,
      });

      // Notify the OTHER participant in real time (for unread count + toast)
      if (otherUser) {
        io.to(`user_${otherUser}`).emit('notification', {
          type: 'new_message',
          title: `New message from ${req.user.name}`,
          message: hasText
            ? message.trim().slice(0, 120)
            : `Sent ${safeAttachments.length} attachment(s)`,
          relatedProject: chat.project,
          chatId: chat._id,
        });
      }
    }

    res.status(201).json({ success: true, message: populatedMessage });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark messages as read
 * @route   PATCH /api/chats/:chatId/read
 * @access  Private
 */
const markMessagesRead = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found.' });
    }

    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    await Message.updateMany(
      { chat: chat._id, sender: { $ne: req.user._id }, read: false },
      { read: true }
    );

    res.status(200).json({ success: true, message: 'Messages marked as read.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get total unread message count for the logged-in user
 * @route   GET /api/chats/unread-count
 * @access  Private
 */
const getUnreadMessageCount = async (req, res, next) => {
  try {
    const myChats = await Chat.find({ participants: req.user._id }).distinct('_id');

    const unreadCount = await Message.countDocuments({
      chat: { $in: myChats },
      sender: { $ne: req.user._id },
      read: false,
    });

    res.status(200).json({ success: true, unreadCount });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyChats,
  getOrCreateProjectChat,
  getChatMessages,
  sendMessage,
  markMessagesRead,
  getUnreadMessageCount,
};
