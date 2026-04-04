import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5001');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for attaching JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vision_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401s (Token expiry or unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Agar 401 aata hai, aur request login ki NAHI thi, tabhi logout karo (token expire hua hai)
    // Warna login fail hone par interceptor page reload kar dega error dikhane ki bajaye!
    if (error.response?.status === 401 && !error.config?.url?.includes('/login')) {
      localStorage.removeItem('vision_token');
      localStorage.removeItem('vision_role');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
