import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, name) => api.post('/auth/register', { email, password, name }),
  me: () => api.get('/auth/me'),
};

export const stocksAPI = {
  list: () => api.get('/stocks'),
  detail: (symbol) => api.get(`/stocks/${symbol}`),
  refresh: () => api.post('/stocks/refresh'),
};

export const analyzeAPI = {
  analyze: (symbol) => api.post(`/analyze/${symbol}`),
  history: () => api.get('/analyze/history'),
};

export const alertsAPI = {
  list: () => api.get('/alerts'),
  create: (symbol, condition) => api.post('/alerts', { symbol, condition }),
  delete: (id) => api.delete(`/alerts/${id}`),
  triggered: () => api.get('/alerts/triggered'),
};

export default api;
