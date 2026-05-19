/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { FacultyDashboard } from './components/FacultyDashboard';
import { StudentDashboard } from './components/StudentDashboard';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-stone-200 border-t-stone-800" />
          <p className="font-mono text-xs uppercase tracking-widest text-stone-500">Initializing System...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <p className="font-mono text-xs uppercase tracking-widest text-stone-500">Loading Profile...</p>
      </div>
    );
  }

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {profile.role === 'admin' && <AdminDashboard view={currentView} setView={setCurrentView} />}
      {profile.role === 'faculty' && <FacultyDashboard view={currentView} setView={setCurrentView} />}
      {profile.role === 'student' && <StudentDashboard view={currentView} setView={setCurrentView} />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
