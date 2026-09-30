import api from './api';

export const projectService = {
  createProject: async (data) => {
    const response = await api.post('/projects', data);
    return response.data;
  },
  getMyProjects: async (params) => {
    const response = await api.get('/projects/my', { params });
    return response.data;
  },
  getAllProjects: async (params) => {
    const response = await api.get('/projects', { params });
    return response.data;
  },
  getProjectById: async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },
  updateProject: async (id, data) => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },
  deleteProject: async (id) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },
  getProjectApplications: async (projectId) => {
    const response = await api.get(`/projects/${projectId}/applications`);
    return response.data;
  },
  getClientApplications: async (params) => {
    const response = await api.get('/projects/applications/mine', { params });
    return response.data;
  },
  updateApplicationStatus: async (projectId, appId, status) => {
    const response = await api.patch(`/projects/${projectId}/applications/${appId}/status`, { status });
    return response.data;
  },
  markCompleted: async (id) => {
    const response = await api.patch(`/projects/${id}/complete`);
    return response.data;
  },
  requestRevision: async (id, note) => {
    const response = await api.patch(`/projects/${id}/revision`, { note });
    return response.data;
  },
  getClientStats: async () => {
    const response = await api.get('/projects/stats/client');
    return response.data;
  },
};

export const reviewService = {
  createReview: async (data) => {
    const response = await api.post('/reviews', data);
    return response.data;
  },
  getUserReviews: async (userId) => {
    const response = await api.get(`/reviews/user/${userId}`);
    return response.data;
  },
  getProjectReviews: async (projectId) => {
    const response = await api.get(`/reviews/project/${projectId}`);
    return response.data;
  },
};

export const userService = {
  getFreelancers: async (params) => {
    const response = await api.get('/users/freelancers', { params });
    return response.data;
  },
  getFreelancerProfile: async (id) => {
    const response = await api.get(`/users/freelancers/${id}`);
    return response.data;
  },
};
