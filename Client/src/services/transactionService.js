import api from './api';

export const transactionService = {
  getMyTransactions: async (params) => {
    const response = await api.get('/transactions', { params });
    return response.data;
  },
  getProjectTransaction: async (projectId) => {
    const response = await api.get(`/transactions/project/${projectId}`);
    return response.data;
  },
  release: async (id) => {
    const response = await api.post(`/transactions/${id}/release`);
    return response.data;
  },
  refund: async (id) => {
    const response = await api.post(`/transactions/${id}/refund`);
    return response.data;
  },
  fail: async (id) => {
    const response = await api.post(`/transactions/${id}/fail`, {});
    return response.data;
  },
};
