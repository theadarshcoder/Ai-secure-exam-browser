import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'; 

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for attaching JWT
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('vision_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if ((error.response.status === 401 || error.response.status === 403) && !error.config?.url?.includes('/login')) {
        sessionStorage.clear(); localStorage.clear();
        window.location.href = '/login';
      } else {
        // Show Reference ID for support
        const errorId = error.response.data?.errorId;
        const message = error.response.data?.message || error.message;
        if (errorId) {
          console.error(`[Reference ID: ${errorId}] ${message}`);
          // alert(`Error: ${message}\nReference ID: ${errorId}`); // Optional: user-friendly alert
        }
      }
    }
    return Promise.reject(error);
  }
);

// Run Coding Question via Judge0
export const runCodingQuestion = async (examId, questionId, sourceCode, language, isSubmit = false) => {
  try {
    const response = await api.post('/api/exams/run-code', {
      examId,
      questionId,
      sourceCode,
      language,
      isSubmit
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// ─────────────────────────────────────────────────────────
// User Management APIs
// ─────────────────────────────────────────────────────────

// Students
export const getStudents = async () => {
    try {
        const response = await api.get('/api/admin/students');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const removeStudent = async (id) => {
    try {
        const response = await api.delete(`/api/admin/students/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Mentors
export const getMentors = async () => {
    try {
        const response = await api.get('/api/admin/mentors');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getAdmins = async () => {
    try {
        const response = await api.get('/api/admin/admins');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const removeMentor = async (id) => {
    try {
        const response = await api.delete(`/api/admin/mentors/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Add any User (Student/Mentor)
export const addUser = async (userData) => {
    try {
        const response = await api.post('/api/auth/register', userData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// ─────────────────────────────────────────────────────────
// Monitoring & Health
// ─────────────────────────────────────────────────────────

export const getSystemHealth = async () => {
    try {
        const response = await api.get('/api/admin/health');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getDashboardStats = async () => {
    try {
        const response = await api.get('/api/admin/stats');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const bulkImportUsers = async (usersArray) => {
    try {
        const response = await api.post('/api/admin/bulk-import', { users: usersArray });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getSettings = async () => {
    try {
        const response = await api.get('/api/admin/settings');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const saveSettings = async (settingsData) => {
    try {
        const response = await api.post('/api/admin/settings', settingsData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getAdminExams = async () => {
    try {
        const response = await api.get('/api/exams/mentor-list');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};


export const getAuditLogs = async () => {
    try {
        const response = await api.get('/api/admin/audit-logs');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// ─────────────────────────────────────────────────────────
// Mentor Dashboard APIs
// ─────────────────────────────────────────────────────────

export const getMentorStats = async () => {
    try {
        const response = await api.get('/api/exams/mentor-stats');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getMentorExamList = async () => {
    try {
        const response = await api.get('/api/exams/mentor-list');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getAdminResults = async () => {
    try {
        const response = await api.get('/api/admin/results');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getAllResults = getAdminResults;

export const deleteExam = async (id) => {
    try {
        const response = await api.delete(`/api/exams/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// ─────────────────────────────────────────────────────────
// 🆕 Evaluation & Session Detail APIs
// ─────────────────────────────────────────────────────────

// Get full session detail (questions + answers + grading results)
export const getSessionDetail = async (sessionId) => {
    try {
        const response = await api.get(`/api/exams/session-detail/${sessionId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Mentor evaluates short answers 
export const evaluateSession = async (sessionId, grades) => {
    try {
        const response = await api.put(`/api/exams/evaluate/${sessionId}`, { grades });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Student requests help from mentor
export const requestHelp = async (msg) => {
    try {
        const response = await api.post('/api/exams/help', { msg });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export default api;
