
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
import { UserRole } from './types';
import { GpcProcessos } from './pages/GpcProcessos_v2';
import { GpcRelatorios } from './pages/GpcRelatorios';

const ProtectedRoute = ({ children, adminOnly = false, gpcAllowed = false, gpcForbidden = false }: { children?: React.ReactNode, adminOnly?: boolean, gpcAllowed?: boolean, gpcForbidden?: boolean }) => {
  const { currentUser } = useApp();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && currentUser.role !== UserRole.ADMIN) {
    return <Navigate to={currentUser.role === UserRole.GPC ? '/gpc' : '/dashboard'} replace />;
  }

  if (gpcAllowed && currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.GPC) {
    return <Navigate to="/dashboard" replace />;
  }

  // GPC users cannot access non-GPC pages
  if (gpcForbidden && currentUser.role === UserRole.GPC) {
    return <Navigate to="/gpc" replace />;
  }

  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  const { currentUser } = useApp();

  return (
    <Routes>
      <Route path="/login" element={
        currentUser
          ? <Navigate to={currentUser.role === UserRole.GPC ? '/gpc' : '/dashboard'} />
          : <Login />
      } />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Navigate to={currentUser?.role === UserRole.GPC ? '/gpc' : '/dashboard'} replace />
        </ProtectedRoute>
      } />
      
      <Route path="/dashboard" element={
        <ProtectedRoute gpcForbidden>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/processos" element={
        <ProtectedRoute gpcForbidden>
          <ProcessManager />
        </ProtectedRoute>
      } />

      <Route path="/prestacao-contas" element={
        <ProtectedRoute gpcForbidden>
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
        <ProtectedRoute gpcAllowed>
          <GpcProcessos />
        </ProtectedRoute>
      } />

      <Route path="/gpc/relatorios" element={
        <ProtectedRoute gpcAllowed>
          <GpcRelatorios />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to={currentUser?.role === UserRole.GPC ? '/gpc' : '/dashboard'} />} />
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
