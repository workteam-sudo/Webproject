/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { FacultyDashboard } from './components/FacultyDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { ShieldCheck } from 'lucide-react';

function AppContent() {
  const { user, profile, loading, logout, error } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const location = useLocation();
  const navigate = useNavigate();

  // Root redirect logic
  useEffect(() => {
    if (!loading && user && profile && (location.pathname === '/' || location.pathname === '/login')) {
      navigate(`/${profile.role}`, { replace: true });
    }
  }, [loading, user, profile, location.pathname, navigate]);

  if (loading || (user && !profile)) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-stone-200 border-t-stone-800" />
            <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-stone-900" size={24} />
          </div>
          <div className="text-center">
            <p className="font-mono text-[10px] uppercase font-bold tracking-[0.4em] text-stone-900 mb-2">System Initialization</p>
            <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Configuring Security Protocols...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      
      <Route path="/admin/*" element={
        profile.role === 'admin' ? (
          <Layout currentView={currentView} onViewChange={setCurrentView}>
            <AdminDashboard view={currentView} setView={setCurrentView} />
          </Layout>
        ) : <Navigate to="/" replace />
      } />

      <Route path="/faculty/*" element={
        profile.role === 'faculty' ? (
          <Layout currentView={currentView} onViewChange={setCurrentView}>
            <FacultyDashboard view={currentView} setView={setCurrentView} />
          </Layout>
        ) : <Navigate to="/" replace />
      } />

      <Route path="/student/*" element={
        profile.role === 'student' ? (
          <Layout currentView={currentView} onViewChange={setCurrentView}>
            <StudentDashboard view={currentView} setView={setCurrentView} />
          </Layout>
        ) : <Navigate to="/" replace />
      } />

      <Route path="/" element={
        profile.role === 'admin' ? <Navigate to="/admin" replace /> :
        profile.role === 'faculty' ? <Navigate to="/faculty" replace /> :
        profile.role === 'student' ? <Navigate to="/student" replace /> :
        <div className="p-10">Unauthorized role. Please contact support.</div>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Helper to use motion/lucide if needed
const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
