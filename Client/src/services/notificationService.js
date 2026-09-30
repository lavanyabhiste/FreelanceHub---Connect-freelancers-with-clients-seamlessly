import api from './api';

export const notificationService = {
  getNotifications: async (params) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },
  markAsRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },
  deleteNotification: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};

export const uploadService = {
  uploadChatFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload/chat', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return response.data;
  },
};
