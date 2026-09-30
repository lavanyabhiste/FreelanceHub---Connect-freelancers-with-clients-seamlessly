const express = require('express');
const router = express.Router();
const {
  getMyChats,
  getOrCreateProjectChat,
  getChatMessages,
  sendMessage,
  markMessagesRead,
  getUnreadMessageCount,
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getMyChats);
router.get('/unread-count', getUnreadMessageCount);
router.get('/project/:projectId', getOrCreateProjectChat);
router.get('/:chatId/messages', getChatMessages);
router.post('/:chatId/messages', sendMessage);
router.patch('/:chatId/read', markMessagesRead);

module.exports = router;
