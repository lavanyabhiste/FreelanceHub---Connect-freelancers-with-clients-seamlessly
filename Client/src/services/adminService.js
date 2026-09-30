import api from './api';

// ─── Admin APIs (JWT + Admin role enforced server-side) ─────────────────────
export const adminService = {
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
  getUsers: async (params) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },
  verifyUser: async (id, isVerified) => {
    const response = await api.patch(`/admin/users/${id}/verify`, { isVerified });
    return response.data;
  },
  setUserStatus: async (id, isActive) => {
    const response = await api.patch(`/admin/users/${id}/status`, { isActive });
    return response.data;
  },
  getProjects: async (params) => {
    const response = await api.get('/admin/projects', { params });
    return response.data;
  },
  moderateProject: async (id, status) => {
    const response = await api.patch(`/admin/projects/${id}/status`, { status });
    return response.data;
  },
  deleteProject: async (id) => {
    const response = await api.delete(`/admin/projects/${id}`);
    return response.data;
  },
  getApplications: async (params) => {
    const response = await api.get('/admin/applications', { params });
    return response.data;
  },
  getTransactions: async (params) => {
    const response = await api.get('/admin/transactions', { params });
    return response.data;
  },
  getDisputes: async (params) => {
    const response = await api.get('/admin/disputes', { params });
    return response.data;
  },
  updateDispute: async (id, payload) => {
    const response = await api.patch(`/admin/disputes/${id}`, payload);
    return response.data;
  },
};

// ─── Dispute APIs (any authenticated participant) ───────────────────────────
export const disputeService = {
  createDispute: async (payload) => {
    const response = await api.post('/disputes', payload);
    return response.data;
  },
  getMyDisputes: async (params) => {
    const response = await api.get('/disputes/mine', { params });
    return response.data;
  },
};
