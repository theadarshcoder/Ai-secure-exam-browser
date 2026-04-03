import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import { ThemeProvider } from './contexts/ThemeContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import MentorDashboard from './pages/MentorDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ExamCockpit from './pages/ExamCockpit';
import CreateExam from './pages/CreateExam';
import IDVerification from './pages/IDVerification';
import ExamWaitingRoom from './pages/ExamWaitingRoom';
import NotFound from './pages/NotFound';

/* ─── Role-Based Dashboard Redirect ─── */
const DashboardRedirect = () => {
  const role = localStorage.getItem('vision_role') || 'student';
  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'mentor') return <Navigate to="/mentor" replace />;
  return <Navigate to="/student" replace />;
};

export default function AppRouter() {
  return (
    <ThemeProvider>
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
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
