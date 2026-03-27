import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password) => api.post('/auth/register', { email, password })
};

export const stocksAPI = {
  getAll: () => api.get('/stocks'),
  getOne: (symbol) => api.get(`/stocks/${symbol}`),
  getChart: (symbol) => api.get(`/stocks/${symbol}/chart`)
};

export const signalsAPI = {
  getAll: () => api.get('/signals'),
  getOne: (symbol) => api.get(`/signals/${symbol}`),
  getHistory: (symbol) => api.get(`/signals/${symbol}/history`)
};

export const alertsAPI = {
  getAll: () => api.get('/alerts'),
  create: (symbol, condition) => api.post('/alerts', { symbol, condition }),
  update: (id, data) => api.patch(`/alerts/${id}`, data),
  delete: (id) => api.delete(`/alerts/${id}`)
};

export default api;
