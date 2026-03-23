import axios from 'axios';

const api = axios.create({
  baseURL: import.meta?.env?.VITE_API_BASE || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smis_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('smis_token');
      localStorage.removeItem('smis_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
