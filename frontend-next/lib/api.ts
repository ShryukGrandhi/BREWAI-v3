/**
 * BREWAI v4 API Client
 * Author: BUILD-AGENT v1
 * 
 * Axios client for backend API communication.
 */

import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const TOKEN_KEY = 'brewai_token';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      Cookies.remove(TOKEN_KEY);
      Cookies.remove('brewai_refresh_token');
      
      // Redirect to login if not already there
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API helper functions
export const apiHelpers = {
  // Auth
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  register: (data: { name: string; email: string; password: string; restaurantName?: string }) =>
    api.post('/auth/register', data),
  
  getMe: () => api.get('/auth/me'),

  // Restaurant
  getRestaurant: (id: string) => api.get(`/restaurant/${id}`),
  getRestaurantBySlug: (slug: string) => api.get(`/restaurant/slug/${slug}`),
  getSiteConfig: (id: string) => api.get(`/restaurant/${id}/site_config`),
  updateSiteConfig: (id: string, config: Record<string, unknown>) => 
    api.put(`/restaurant/${id}/site_config`, { siteConfig: config }),

  // Menu
  getMenu: (restaurantId: string) => api.get(`/menu?restaurantId=${restaurantId}`),
  createMenuItem: (data: Record<string, unknown>) => api.post('/menu', data),
  updateMenuItem: (id: string, data: Record<string, unknown>) => api.put(`/menu/${id}`, data),
  deleteMenuItem: (id: string) => api.delete(`/menu/${id}`),

  // Announcements
  getAnnouncements: (restaurantId: string) => 
    api.get(`/restaurant/${restaurantId}/announcements`),
  createAnnouncement: (restaurantId: string, data: Record<string, unknown>) =>
    api.post(`/restaurant/${restaurantId}/announcements`, data),
  publishAnnouncement: (restaurantId: string, announcementId: string) =>
    api.post(`/restaurant/${restaurantId}/announcements/${announcementId}/publish`),

  // Analytics
  createSession: (data: Record<string, unknown>) => api.post('/analytics/sessions', data),
  sendEvents: (sessionId: string, events: Record<string, unknown>[]) =>
    api.post('/analytics/events', { sessionId, events }),
  uploadReplayChunk: (sessionId: string, chunk: unknown, eventCount: number) =>
    api.post('/analytics/replay-chunk', { sessionId, chunk, eventCount }),
  getSessions: (restaurantId: string, params?: Record<string, unknown>) =>
    api.get('/analytics/sessions', { params: { restaurantId, ...params } }),
  getSession: (sessionId: string) => api.get(`/analytics/sessions/${sessionId}`),
  getSessionReplay: (sessionId: string) => api.get(`/analytics/sessions/${sessionId}/replay`),

  // Agents
  getAgentActions: (restaurantId: string, params?: Record<string, unknown>) =>
    api.get('/agents/actions', { params: { restaurantId, ...params } }),
  approveAgentAction: (actionId: string, notes?: string) =>
    api.post(`/agents/actions/${actionId}/approve`, { notes }),
  rejectAgentAction: (actionId: string, notes: string) =>
    api.post(`/agents/actions/${actionId}/reject`, { notes }),

  // Search
  askOpsQuestion: (restaurantId: string, question: string) =>
    api.post('/search/ops-qna', { restaurantId, question }),
};

export default api;
