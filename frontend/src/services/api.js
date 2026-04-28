import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'; 

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for attaching JWT
api.interceptors.request.use(
  async (config) => {
    const token = sessionStorage.getItem('vision_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }



    return config;
  },
  (error) => Promise.reject(error)
);

// Helper to get current user ID safely
export const getCurrentUserId = () => {
  const id = sessionStorage.getItem('vision_id');
  if (id) return id;
  
  // Fallback: Decode JWT if ID is missing in storage
  const token = sessionStorage.getItem('vision_token');
  if (token) {
    try {
      // 🛡️ Fix 6: Robust JWT decoding using library
      const payload = jwtDecode(token);
      return payload.id || null;
    } catch (e) {
      return null;
    }
  }
  return null;
};

let isRedirecting = false; // 🛡️ Fix Bug 4: Prevent infinite redirect flicker

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor for handling 401s and Silent Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 🛡️ Fix 19 (Upgraded): Full Promise Queue for Refresh Token Storm
    if (error.response?.status === 403 && error.response.data?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('vision_refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken });
        
        sessionStorage.setItem('vision_token', data.accessToken);
        api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
        
        processQueue(null, data.accessToken);
        
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        console.error('🛡️ Silent Refresh Failed:', refreshError);
        sessionStorage.clear();
        localStorage.removeItem('vision_refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 🛡️ Handle Unauthorized (401)
    if (error.response?.status === 401 && !error.config?.url?.includes('/login')) {
      if (!isRedirecting) {
        isRedirecting = true;
        sessionStorage.clear(); 
        localStorage.removeItem('vision_refresh_token');
        window.location.href = '/login';
        setTimeout(() => { isRedirecting = false; }, 5000);
      }
    } else {
      const errorId = error.response?.data?.errorId;
      const message = getErrorMessage(error);
      if (errorId) console.error(`[Reference ID: ${errorId}] ${message}`);
    }
    
    return Promise.reject(error);
  }
);

// 🛡️ Robust Error Parsing (Bug 5 Fix + Phase 5 Governance)
const getErrorMessage = (error) => {
    const errData = error.response?.data;
    if (!errData) return error.message || 'System error occurred. Please try again later.';
    
    // If errData.error is a string, use it directly
    if (typeof errData.error === 'string') return errData.error;
    
    // If errData.error is an object (nested validation response), extract the message
    if (errData.error && typeof errData.error === 'object') {
        return errData.error.message || JSON.stringify(errData.error);
    }

    // Fallback to message field
    if (typeof errData.message === 'string') return errData.message;

    // Fallback to raw string response (but not HTML error pages)
    if (typeof errData === 'string' && !errData.startsWith('<!DOCTYPE')) return errData;

    return error.message || 'System error occurred. Please try again later.';
};

// Run Coding Question via Judge0
export const runCodingQuestion = async (examId, questionId, sourceCode, language, isSubmit = false) => {
  // 🛡️ Fix 25: Frontend UX validation for source code size (Max 10KB)
  if (sourceCode && sourceCode.length > 10000) {
      throw 'Source code is too large. Maximum allowed size is 10KB.';
  }

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
    throw getErrorMessage(error);
  }
};

// ─────────────────────────────────────────────────────────
// User Management APIs
// ─────────────────────────────────────────────────────────

// Students
export const getStudents = async (page = 1, limit = 10) => {
    try {
        const response = await api.get('/api/admin/students', { params: { page, limit } });
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
    }
};

export const removeStudent = async (id) => {
    try {
        const response = await api.delete(`/api/admin/students/${id}`);
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
    }
};

// Mentors
export const getMentors = async (page = 1, limit = 10) => {
    try {
        const response = await api.get('/api/admin/mentors', { params: { page, limit } });
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
    }
};

export const getAdmins = async () => {
    try {
        const response = await api.get('/api/admin/admins');
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
    }
};

export const removeMentor = async (id) => {
    try {
        const response = await api.delete(`/api/admin/mentors/${id}`);
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
    }
};

// Add any User (Student/Mentor)
export const addUser = async (userData) => {
    try {
        const response = await api.post('/api/auth/register', userData);
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
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
        throw getErrorMessage(error);
    }
};

export const getDashboardStats = async () => {
    try {
        const response = await api.get('/api/admin/stats');
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
    }
};

export const getLiveSessions = async () => {
    try {
        const response = await api.get('/api/admin/live-sessions');
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
    }
};

export const bulkImportUsers = async (usersArray) => {
    try {
        const response = await api.post('/api/admin/bulk-import', { users: usersArray });
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
    }
};

export const getSettings = async () => {
    try {
        const response = await api.get('/api/admin/settings');
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
    }
};

export const saveSettings = async (settingsData) => {
    try {
        const response = await api.post('/api/admin/settings', settingsData);
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
    }
};

export const getAdminExams = async () => {
    try {
        const response = await api.get('/api/exams/mentor-list');
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
    }
};


export const getAuditLogs = async () => {
    try {
        const response = await api.get('/api/admin/audit-logs');
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
    }
};

export const deleteAuditLog = async (id) => {
    try {
        const response = await api.delete(`/api/admin/audit-logs/${id}`);
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
    }
};

export const clearAllAuditLogs = async () => {
    try {
        const response = await api.delete('/api/admin/audit-logs');
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
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
        throw getErrorMessage(error);
    }
};

export const getMentorExamList = async () => {
    try {
        const response = await api.get('/api/exams/mentor-list');
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
    }
};

export const getAdminResults = async () => {
    try {
        const response = await api.get('/api/admin/results');
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
    }
};

export const getAllResults = getAdminResults;

export const deleteExam = async (id) => {
    try {
        const response = await api.delete(`/api/exams/${id}`);
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
    }
};

export const togglePublishResults = async (id, resultsPublished) => {
    try {
        const response = await api.put(`/api/exams/${id}/publish-results`, { resultsPublished });
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
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
        throw getErrorMessage(error);
    }
};

// Mentor evaluates short answers 
export const evaluateSession = async (sessionId, grades) => {
    try {
        const response = await api.put(`/api/exams/evaluate/${sessionId}`, { grades });
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
    }
};

// Student requests help from mentor
export const requestHelp = async (examId, msg) => {
    try {
        const response = await api.post('/api/exams/help', { examId, msg });
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
    }
};

// ─────────────────────────────────────────────────────────
// Candidate eKYC Identity APIs
// ─────────────────────────────────────────────────────────

export const getCandidates = async (search = '', page = 1, limit = 20) => {
    try {
        const response = await api.get('/api/admin/candidates', { params: { search, page, limit } });
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
    }
};

export const verifyCandidate = async (userId) => {
    try {
        const response = await api.put(`/api/admin/candidates/verify/${userId}`);
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
    }
};

export const unverifyCandidate = async (userId) => {
    try {
        const response = await api.put(`/api/admin/candidates/unverify/${userId}`);
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
    }
};

// ─────────────────────────────────────────────────────────
// 📨 Bulk Invite System APIs
// ─────────────────────────────────────────────────────────

export const bulkInviteStudents = async (examId, students) => {
    try {
        const response = await api.post(`/api/exams/${examId}/bulk-invite`, { students });
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
    }
};

export const verifyInviteToken = async (token, deviceId) => {
    try {
        const response = await api.post('/api/auth/verify-invite', { token, deviceId });
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
    }
};

export const getInviteStatus = async (examId) => {
    try {
        const response = await api.get(`/api/exams/${examId}/invites`);
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
    }
};

export const resendInvite = async (examId, email) => {
    try {
        const response = await api.post(`/api/exams/${examId}/resend-invite`, { email });
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
    }
};

// Student Intelligence Report
export const getStudentReport = async (studentId, page = 1, limit = 10) => {
    try {
        const response = await api.get(`/api/admin/students/${studentId}/report`, {
            params: { page, limit }
        });
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
    }
};

export default api;
