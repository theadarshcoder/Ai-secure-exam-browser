import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import MentorDashboard from './pages/MentorDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ExamCockpit from './pages/ExamCockpit';
import CreateExam from './pages/CreateExam';
import IDVerification from './pages/IDVerification';
import ExamWaitingRoom from './pages/ExamWaitingRoom';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/mentor" element={<MentorDashboard />} />
          <Route path="/mentor/create-exam" element={<CreateExam />} />
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/exam/:examId" element={<ExamCockpit />} />
          <Route path="/exam/:examId/verify" element={<IDVerification />} />
          <Route path="/exam/:examId/waiting" element={<ExamWaitingRoom />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
