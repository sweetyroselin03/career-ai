import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/Common/ProtectedRoute';
import Layout from './components/Common/Layout';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Recommendations from './pages/Recommendations';
import CareerDetails from './pages/CareerDetails';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import CareerInsights from './pages/CareerInsights';
import ChatbotPage from './pages/ChatbotPage';
import SkillAssessment from './pages/SkillAssessment';
import SkillGap from './pages/SkillGap';
import Roadmap from './pages/Roadmap';
import Certificates from './pages/Certificates';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Auth Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Main Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/assessment" element={<SkillAssessment />} />
              <Route path="/skill-assessment" element={<SkillAssessment />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/career-recommendations" element={<Recommendations />} />
              <Route path="/career/:id" element={<CareerDetails />} />
              <Route path="/gap" element={<SkillGap />} />
              <Route path="/skill-gap-analysis" element={<SkillGap />} />
              <Route path="/roadmap" element={<Roadmap />} />
              <Route path="/learning-roadmap" element={<Roadmap />} />
              <Route path="/resume" element={<ResumeAnalyzer />} />
              <Route path="/resume-analyzer" element={<ResumeAnalyzer />} />
              <Route path="/insights" element={<CareerInsights />} />
              <Route path="/certificates" element={<Certificates />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/chatbot" element={<ChatbotPage />} />
              <Route path="/career-assistant" element={<ChatbotPage />} />
              
              {/* Admin Only Route */}
              <Route element={<ProtectedRoute requiredRole="admin" />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback redirection */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
