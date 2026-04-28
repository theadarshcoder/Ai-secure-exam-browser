import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import MainLayout from './components/MainLayout';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import MentorDashboard from './pages/MentorDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ExamCockpit from './pages/ExamCockpit';
import CreateExam from './pages/CreateExam';
import IDVerification from './pages/IDVerification';
import ExamWaitingRoom from './pages/ExamWaitingRoom';
import SessionMonitor from './pages/SessionMonitor';
import StudentResult from './pages/StudentResult';
import VerifyInvite from './pages/VerifyInvite';
import StudentIntelligenceDashboard from './pages/StudentIntelligenceDashboard';
import MentorLiveMonitoring from './pages/MentorLiveMonitoring';

const ThemeEnforcer = () => {
  const { pathname } = useLocation();
  const { theme } = useTheme();

  // Apply synchronously on every render (not just after mount)
  // so there is zero gap between navigation and theme application.
  const isAdmin = pathname.startsWith('/admin');
  const isMentor = pathname.startsWith('/mentor');
  if (isAdmin || isMentor) {
    document.documentElement.setAttribute('data-theme', theme);
  } else {
    document.documentElement.removeAttribute('data-theme');
  }

  useEffect(() => {
    const isAdmin = pathname.startsWith('/admin');
    const isMentor = pathname.startsWith('/mentor');
    if (isAdmin || isMentor) {
      document.documentElement.setAttribute('data-theme', theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [pathname, theme]);

  return null;
};

// --- Mock/Utility Components to prevent crashes ---
// 🛡️ Security Fix: Extract role from JWT instead of trusting SessionStorage
const getRoleFromToken = (token) => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload).role?.toLowerCase();
  } catch (e) {
    console.error("Token decoding failed:", e);
    return null;
  }
};

const DashboardRedirect = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const token = sessionStorage.getItem('vision_token');
    const role = getRoleFromToken(token);

    if (role === 'admin' || role === 'super_mentor') navigate('/admin');
    else if (role === 'mentor') navigate('/mentor');
    else if (role === 'student') navigate('/student');
    else navigate('/login');
  }, [navigate]);
  return null;
};

const ProtectedRoute = ({ allowedRoles, children }) => {
  const token = sessionStorage.getItem('vision_token');
  const role = getRoleFromToken(token);

  if (!token || !role) {
    sessionStorage.clear(); // Clear potentially corrupted/stale data
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    console.warn(`🔒 Access Denied: User role "${role}" is not in ${allowedRoles}`);
    const redirectMap = {
      admin: '/admin',
      super_mentor: '/admin',
      mentor: '/mentor',
      student: '/student'
    };
    return <Navigate to={redirectMap[role] || '/login'} replace />;
  }

  return children;
};

const LoginRedirect = () => {
  // 🛡️ Always show login page when explicitly requested
  return <LoginPage />;
};

const NotFound = () => (
  <div className="h-screen flex flex-col items-center justify-center bg-[#0a0c10] text-white">
    <h1 className="text-6xl font-bold mb-4">404</h1>
    <p className="text-slate-500 uppercase tracking-widest text-xs">Node Not Found</p>
    <a href="/" className="mt-8 px-6 py-2 bg-white text-black rounded-xl font-bold text-xs uppercase">Return to Base</a>
  </div>
);

export default function AppRouter() {
  return (
    <ThemeProvider>
    <BrowserRouter>
      <ThemeEnforcer />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginRedirect />} />
          <Route path="/verify" element={<VerifyInvite />} />
          
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin', 'super_mentor']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          
          <Route path="/mentor" element={
            <ProtectedRoute allowedRoles={['mentor', 'admin', 'super_mentor']}>
              <MentorDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/mentor/create-exam" element={
            <ProtectedRoute allowedRoles={['mentor', 'admin', 'super_mentor']}>
              <CreateExam />
            </ProtectedRoute>
          } />
          
          <Route path="/mentor/exam/:examId/monitoring" element={
            <ProtectedRoute allowedRoles={['mentor', 'admin', 'super_mentor']}>
              <MentorLiveMonitoring />
            </ProtectedRoute>
          } />
          
          <Route path="/student" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/candidate" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/exam/:examId" element={
            <ProtectedRoute allowedRoles={['student']}>
              <ExamCockpit />
            </ProtectedRoute>
          } />
          
          <Route path="/exam/:examId/verify" element={
            <ProtectedRoute allowedRoles={['student']}>
              <IDVerification />
            </ProtectedRoute>
          } />
          
          <Route path="/exam/:examId/waiting" element={
            <ProtectedRoute allowedRoles={['student']}>
              <ExamWaitingRoom />
            </ProtectedRoute>
          } />

          <Route path="/exam/:examId/result" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentResult />
            </ProtectedRoute>
          } />

          <Route path="/admin/students/:studentId/intelligence" element={
            <ProtectedRoute allowedRoles={['admin', 'super_mentor', 'mentor']}>
              <StudentIntelligenceDashboard />
            </ProtectedRoute>
          } />
          
          {/* Dashboard Redirect */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          } />

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  );
}
