import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
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
  const { theme, toggleTheme } = useTheme();

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
        </Route>
      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  );
}
