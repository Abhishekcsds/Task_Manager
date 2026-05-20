// import axios from 'axios';

// const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// const api = axios.create({
//   baseURL: API_URL,
//   headers: { 'Content-Type': 'application/json' }
// });

// // Attach token to every request
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('token');
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// // Handle auth errors globally
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem('token');
//       window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   }
// );

// // Auth
// export const authAPI = {
//   register: (data) => api.post('/auth/register', data),
//   login: (data) => api.post('/auth/login', data),
//   getMe: () => api.get('/auth/me'),
//   updateProfile: (data) => api.patch('/auth/me', data),
// };

// // Projects
// export const projectAPI = {
//   getAll: () => api.get('/projects'),
//   getOne: (id) => api.get(`/projects/${id}`),
//   create: (data) => api.post('/projects', data),
//   update: (id, data) => api.put(`/projects/${id}`, data),
//   delete: (id) => api.delete(`/projects/${id}`),
//   addMember: (id, data) => api.post(`/projects/${id}/members`, data),
//   removeMember: (id, memberId) => api.delete(`/projects/${id}/members/${memberId}`),
// };

// // Tasks
// export const taskAPI = {
//   getByProject: (projectId, params) => api.get(`/tasks/project/${projectId}`, { params }),
//   getOne: (id) => api.get(`/tasks/${id}`),
//   create: (data) => api.post('/tasks', data),
//   update: (id, data) => api.put(`/tasks/${id}`, data),
//   delete: (id) => api.delete(`/tasks/${id}`),
//   getMyTasks: () => api.get('/tasks/my-tasks'),
//   getDashboardStats: () => api.get('/tasks/dashboard-stats'),
// };

// // Users
// export const userAPI = {
//   getAll: () => api.get('/users'),
//   getOne: (id) => api.get(`/users/${id}`),
//   updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
//   delete: (id) => api.delete(`/users/${id}`),
// };

// export default api;


import axios from 'axios';

// Railway will inject REACT_APP_API_URL at build time.
// In local development, it falls back to localhost.
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,   // ✅ matches backend cors({ credentials: true })
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors globally
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

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/me', data),
};

// Projects
export const projectAPI = {
  getAll: () => api.get('/projects'),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  removeMember: (id, memberId) => api.delete(`/projects/${id}/members/${memberId}`),
};

// Tasks
export const taskAPI = {
  getByProject: (projectId, params) => api.get(`/tasks/project/${projectId}`, { params }),
  getOne: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  getMyTasks: () => api.get('/tasks/my-tasks'),
  getDashboardStats: () => api.get('/tasks/dashboard-stats'),
};

// Users
export const userAPI = {
  getAll: () => api.get('/users'),
  getOne: (id) => api.get(`/users/${id}`),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  delete: (id) => api.delete(`/users/${id}`),
};

export default api;