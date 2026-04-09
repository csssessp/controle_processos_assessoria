
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ProcessManager } from './pages/ProcessManager';
import { PrestacaoContas } from './pages/PrestacaoContas';
import { UserManagement } from './pages/UserManagement';
import { Logs } from './pages/Logs';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';
import { UserRole, userHasArea } from './types';
import { GpcProcessos } from './pages/GpcProcessos_v2';
import { GpcRelatorios } from './pages/GpcRelatorios';

/** Resolve a home page based on user areas */
const getHomePath = (user: User | null): string => {
  if (!user) return '/login';
  if (userHasArea(user, 'assessoria')) return '/dashboard';
  if (userHasArea(user, 'gpc')) return '/gpc';
  return '/dashboard';
};

import type { User } from './types';

const ProtectedRoute = ({ children, adminOnly = false, requireArea }: { children?: React.ReactNode, adminOnly?: boolean, requireArea?: 'assessoria' | 'gpc' }) => {
  const { currentUser } = useApp();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && currentUser.role !== UserRole.ADMIN) {
    return <Navigate to={getHomePath(currentUser)} replace />;
  }

  if (requireArea && !userHasArea(currentUser, requireArea)) {
    return <Navigate to={getHomePath(currentUser)} replace />;
  }

  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  const { currentUser } = useApp();

  return (
    <Routes>
      <Route path="/login" element={
        currentUser
          ? <Navigate to={getHomePath(currentUser)} />
          : <Login />
      } />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Navigate to={getHomePath(currentUser)} replace />
        </ProtectedRoute>
      } />
      
      <Route path="/dashboard" element={
        <ProtectedRoute requireArea="assessoria">
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/processos" element={
        <ProtectedRoute requireArea="assessoria">
          <ProcessManager />
        </ProtectedRoute>
      } />

      <Route path="/prestacao-contas" element={
        <ProtectedRoute requireArea="assessoria">
          <PrestacaoContas />
        </ProtectedRoute>
      } />

      <Route path="/perfil" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      
      <Route path="/usuarios" element={
        <ProtectedRoute adminOnly>
          <UserManagement />
        </ProtectedRoute>
      } />
      
      <Route path="/logs" element={
        <ProtectedRoute adminOnly>
          <Logs />
        </ProtectedRoute>
      } />

      <Route path="/gpc" element={
        <ProtectedRoute requireArea="gpc">
          <GpcProcessos />
        </ProtectedRoute>
      } />

      <Route path="/gpc/relatorios" element={
        <ProtectedRoute requireArea="gpc">
          <GpcRelatorios />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to={getHomePath(currentUser)} />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppProvider>
  );
}
