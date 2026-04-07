import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://vision-o16g.onrender.com';

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
    if ((error.response?.status === 401 || error.response?.status === 403) && !error.config?.url?.includes('/login')) {
      localStorage.clear(); // Clear everything for security
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Run Coding Question via Judge0
export const runCodingQuestion = async (examId, questionId, sourceCode, language) => {
  try {
    const response = await api.post('/api/exams/run-code', {
      examId,
      questionId,
      sourceCode,
      language
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ─────────────────────────────────────────────────────────
// User Management APIs
// ─────────────────────────────────────────────────────────

// Fetch all registered students
export const getStudents = async () => {
    try {
        const response = await api.get('/api/admin/students');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Remove a student (Admin only)
export const removeStudent = async (id) => {
    try {
        const response = await api.delete(`/api/admin/students/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Add a new student/user
export const addStudent = async (userData) => {
    try {
        // We use the existing register endpoint for adding users
        const response = await api.post('/api/auth/register', {
            ...userData,
            role: 'student' // Ensure role is student when added from admin panel
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export default api;
