import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.error('Erreur lors de la récupération du token:', e);
  }
  return config;
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Token expiré
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  register: (email, password) =>
    api.post('/auth/register', { email, password })
};

export const stocksAPI = {
  getAll: () =>
    api.get('/stocks'),

  getOne: (symbol) =>
    api.get(`/stocks/${symbol.toUpperCase()}`),

  getChart: (symbol) =>
    api.get(`/stocks/${symbol.toUpperCase()}/chart`)
};

export const signalsAPI = {
  getAll: () =>
    api.get('/signals'),

  getOne: (symbol) =>
    api.get(`/signals/${symbol.toUpperCase()}`),

  getHistory: (symbol) =>
    api.get(`/signals/${symbol.toUpperCase()}/history`)
};

export const alertsAPI = {
  getAll: () =>
    api.get('/alerts'),

  create: (symbol, condition) =>
    api.post('/alerts', { symbol, condition }),

  update: (id, data) =>
    api.patch(`/alerts/${id}`, data),

  delete: (id) =>
    api.delete(`/alerts/${id}`)
};

export const saveToken = async (token) => {
  try {
    await SecureStore.setItemAsync('token', token);
  } catch (e) {
    console.error('Erreur sauvegarde token:', e);
  }
};

export const getToken = async () => {
  try {
    return await SecureStore.getItemAsync('token');
  } catch (e) {
    console.error('Erreur récupération token:', e);
    return null;
  }
};

export const clearAuth = async () => {
  try {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
  } catch (e) {
    console.error('Erreur suppression auth:', e);
  }
};

export default api;
