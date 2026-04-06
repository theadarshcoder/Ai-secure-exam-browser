import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
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
    const role = localStorage.getItem('vision_role')?.toLowerCase();
    if (role === 'admin') navigate('/admin');
    else if (role === 'mentor') navigate('/mentor');
    else navigate('/student');
  }, [navigate]);
  return null;
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
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/session" element={<SessionMonitor />} />
          <Route path="/mentor" element={<MentorDashboard />} />
          <Route path="/mentor/create-exam" element={<CreateExam />} />
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/candidate" element={<StudentDashboard />} />
          <Route path="/exam/:examId" element={<ExamCockpit />} />
          <Route path="/exam/:examId/verify" element={<IDVerification />} />
          <Route path="/exam/:examId/waiting" element={<ExamWaitingRoom />} />
          
          {/* Dashboard Redirect */}
          <Route path="/dashboard" element={<DashboardRedirect />} />

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  );
}
