import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://pharmacy-api-vsjs.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ensure error message is always a string
    if (!error.response) {
      error.message = 'Network error – please check your connection';
    } else if (!error.response.data?.message) {
      error.message = `Server error: ${error.response.status}`;
    } else {
      error.message = error.response.data.message;
    }
    return Promise.reject(error);
  }
);

export default api;
