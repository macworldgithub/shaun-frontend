import React, { useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Deliveries from './pages/Deliveries';
import Messages from './pages/Messages';
import Templates from './pages/Templates';
import MyClients from './pages/MyClients';
import Settings from './pages/Settings';
import AdminUsers from './pages/admin/Users';
import AdminAudit from './pages/admin/AuditLog';
import AdminShareLinks from './pages/admin/ShareLinks';
import AdminImports from './pages/admin/Imports';
import AdminOffers from './pages/admin/Offers';
import AdminInboundQueue from './pages/admin/InboundQueue';
import SharedDashboard from './pages/SharedDashboard';
import UploadPortal from './pages/UploadPortal';
import { Toaster } from './components/ui/sonner';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/share/:token" element={<SharedDashboard />} />
            <Route path="/upload/:token" element={<UploadPortal />} />
            <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/clients/:id" element={<ClientDetail />} />
              <Route path="/my-clients" element={<MyClients />} />
              <Route path="/deliveries" element={<Deliveries />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
              <Route path="/admin/offers" element={<ProtectedRoute requireAdmin><AdminOffers /></ProtectedRoute>} />
              <Route path="/admin/inbound-queue" element={<ProtectedRoute requireAdmin><AdminInboundQueue /></ProtectedRoute>} />
              <Route path="/admin/audit" element={<ProtectedRoute requireAdmin><AdminAudit /></ProtectedRoute>} />
              <Route path="/admin/share" element={<ProtectedRoute requireAdmin><AdminShareLinks /></ProtectedRoute>} />
              <Route path="/admin/imports" element={<ProtectedRoute requireAdmin><AdminImports /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
