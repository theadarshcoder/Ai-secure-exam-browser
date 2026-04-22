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

const ThemeEnforcer = () => {
  const { pathname } = useLocation();
  const { theme } = useTheme();

  useEffect(() => {
    // Force the app into dark mode when visiting the Landing Page
    if (pathname === '/') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      // Re-apply the global theme based on contextual state when navigating away
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [pathname, theme]);

  return null;
};

// --- Mock/Utility Components to prevent crashes ---
const DashboardRedirect = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const role = sessionStorage.getItem('vision_role')?.toLowerCase();
    if (role === 'admin' || role === 'super_mentor') navigate('/admin');
    else if (role === 'mentor') navigate('/mentor');
    else navigate('/student');
  }, [navigate]);
  return null;
};

const ProtectedRoute = ({ allowedRoles, children }) => {
  const token = sessionStorage.getItem('vision_token');
  const role = sessionStorage.getItem('vision_role')?.toLowerCase();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
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
    <h1 className="text-6xl font-black mb-4">404</h1>
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
          
          <Route path="/admin/session" element={
            <ProtectedRoute allowedRoles={['admin', 'super_mentor', 'mentor']}>
              <SessionMonitor />
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
