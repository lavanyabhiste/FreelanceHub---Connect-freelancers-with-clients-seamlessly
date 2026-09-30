import api from './api';

export const chatService = {
  getMyChats: async () => {
    const response = await api.get('/chats');
    return response.data;
  },
  getOrCreateProjectChat: async (projectId) => {
    const response = await api.get(`/chats/project/${projectId}`);
    return response.data;
  },
  getChatMessages: async (chatId) => {
    const response = await api.get(`/chats/${chatId}/messages`);
    return response.data;
  },
  sendMessage: async (chatId, message, attachments = []) => {
    const response = await api.post(`/chats/${chatId}/messages`, { message, attachments });
    return response.data;
  },
  markMessagesRead: async (chatId) => {
    const response = await api.patch(`/chats/${chatId}/read`);
    return response.data;
  },
  getUnreadCount: async () => {
    const response = await api.get('/chats/unread-count');
    return response.data;
  },
};
