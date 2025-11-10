import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', new URLSearchParams({ username: email, password }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
  getConnectedAccounts: () => api.get('/auth/email/accounts'),
  disconnectAccount: (accountId) => api.delete(`/auth/email/accounts/${accountId}`),
}

// Files API
export const filesAPI = {
  upload: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  getStatus: (fileId) => api.get(`/files/${fileId}/status`),
  parse: (fileId) => api.post(`/files/${fileId}/parse`),
  getExtracted: (fileId) => api.get(`/files/${fileId}/extracted`),
  delete: (fileId) => api.delete(`/files/${fileId}`),
  list: () => api.get('/files/'),
}

// AI API
export const aiAPI = {
  generateEmail: (data) => api.post('/ai/generate-email', data),
  getDraft: (draftId) => api.get(`/ai/drafts/${draftId}`),
  listDrafts: (limit = 20) => api.get(`/ai/drafts?limit=${limit}`),
  deleteDraft: (draftId) => api.delete(`/ai/drafts/${draftId}`),
}

// Email API
export const emailAPI = {
  send: (data) => api.post('/email/send', data),
  getStatus: (sendId) => api.get(`/email/sends/${sendId}`),
  listSent: (limit = 20) => api.get(`/email/sent?limit=${limit}`),
  deleteSend: (sendId) => api.delete(`/email/sends/${sendId}`),
}

// Templates API
export const templatesAPI = {
  create: (data) => api.post('/templates/', data),
  list: () => api.get('/templates/'),
  get: (templateId) => api.get(`/templates/${templateId}`),
  update: (templateId, data) => api.put(`/templates/${templateId}`, data),
  delete: (templateId) => api.delete(`/templates/${templateId}`),
  listBuiltin: () => api.get('/templates/builtin/list'),
}

export default api