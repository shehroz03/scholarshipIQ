import axios from 'axios';
import { API_BASE_URL } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (email: string, password: string) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  register: async (data: any) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
};

export const scholarshipService = {
  getScholarships: async (params?: any) => {
    const response = await api.get('/scholarships/', { params });
    return response.data;
  },
  getScholarshipById: async (id: number) => {
    const response = await api.get(`/scholarships/${id}`);
    return response.data;
  },
  getRecommendations: async () => {
    const response = await api.get('/recommendations/');
    return response.data;
  },
  saveScholarship: async (id: number) => {
    const response = await api.post(`/scholarships/${id}/save`);
    return response.data;
  },
  getSavedScholarships: async () => {
    const response = await api.get('/scholarships/saved');
    return response.data;
  },
  getMatchedUniversities: async (params: { country?: string, level?: string, field?: string, keyword?: string }) => {
    const response = await api.get('/scholarships/universities', { params });
    return response.data;
  },
};

export const consultantService = {
  sendMessage: async (content: string, sessionId?: string) => {
    const response = await api.post('/consultant/chat', { content, session_id: sessionId });
    return response.data;
  },
  getHistory: async (sessionId: string) => {
    const response = await api.get(`/consultant/history/${sessionId}`);
    return response.data;
  },
};

export const userService = {
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
  updateProfile: async (data: any) => {
    const response = await api.put('/users/me', data);
    return response.data;
  },
  getDashboardSummary: async () => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },
};

export const applicationService = {
  getApplications: async () => {
    const response = await api.get('/applications/');
    return response.data;
  },
  createApplication: async (data: any) => {
    const response = await api.post('/applications/', data);
    return response.data;
  },
};

export default api;
