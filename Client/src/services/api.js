import axios from 'axios';

/**
 * Central Axios instance for FreelanceHub API communications
 */
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to attach JWT token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('freelancehub_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global handler for expired/invalid sessions — registered in main.jsx to
// avoid a circular import (api.js ← slices ← store).
let unauthorizedHandler = null;
export const setUnauthorizedHandler = (fn) => {
  unauthorizedHandler = fn;
};

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthRoute =
      url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/logout');

    // 401 on an authenticated request → session expired / token revoked.
    // Clear the session globally so protected routes redirect to /login.
    if (status === 401 && !isAuthRoute && localStorage.getItem('freelancehub_token')) {
      unauthorizedHandler?.();
    }

    const message =
      error.response?.data?.message || error.message || 'Something went wrong with the server request';
    return Promise.reject(new Error(message));
  }
);

export const healthService = {
  checkHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export default api;
