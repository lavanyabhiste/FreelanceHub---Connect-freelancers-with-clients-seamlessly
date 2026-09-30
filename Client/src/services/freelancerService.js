import api from './api';

export const freelancerService = {
  getStats: async () => {
    const response = await api.get('/freelancers/stats');
    return response.data;
  },
  getMyApplications: async (params) => {
    const response = await api.get('/freelancers/applications', { params });
    return response.data;
  },
  getMyProjects: async (params) => {
    const response = await api.get('/freelancers/my-projects', { params });
    return response.data;
  },
  submitBid: async (data) => {
    const response = await api.post('/freelancers/bid', data);
    return response.data;
  },
  submitWork: async (data) => {
    const response = await api.post('/freelancers/submit-work', data);
    return response.data;
  },
  updateProfile: async (data) => {
    const response = await api.put('/freelancers/profile', data);
    return response.data;
  },
};
