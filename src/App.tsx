import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ChangeRequests } from './pages/ChangeRequests';
import { NewChangeRequest } from './pages/NewChangeRequest';
import { ChangeRequestDetail } from './pages/ChangeRequestDetail';
import { AuditTrail } from './pages/AuditTrail';
import { getCurrentUser, onAuthChange } from './data/auth';
import { Theme } from './data/db';
import type { User } from './data/types';

// Auth guard
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getCurrentUser());
  useEffect(() => onAuthChange(setUser), []);
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  // Apply theme once on app load
  useEffect(() => {
    const root = document.documentElement;
    if (Theme.get() === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={<RequireAuth><Layout /></RequireAuth>}
        >
          <Route index element={<Dashboard />} />
          <Route path="change-requests" element={<ChangeRequests />} />
          <Route path="new" element={<NewChangeRequest />} />
          <Route path="cr/:id" element={<ChangeRequestDetail />} />
          <Route path="audit" element={<AuditTrail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;
