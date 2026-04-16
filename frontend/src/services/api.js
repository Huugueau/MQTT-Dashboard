import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs d'auth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

export const deviceService = {
  getAll: async () => {
    const response = await api.get('/devices');
    return response.data;
  },

  getOne: async (deviceId) => {
    const response = await api.get(`/devices/${deviceId}`);
    return response.data;
  },

  getHistory: async (deviceId, limit = 100) => {
    const response = await api.get(`/devices/${deviceId}/history?limit=${limit}`);
    return response.data;
  },

  getAggregate: async (deviceId) => {
    const response = await api.get(`/devices/${deviceId}/aggregate`);
    return response.data;
  }
};

export const statsService = {
  getStats: async () => {
    const response = await api.get('/stats');
    return response.data;
  }
};

export default api;
