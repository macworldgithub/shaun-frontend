import React, { lazy, Suspense } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SiteProvider } from './contexts/SiteContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
const Login = lazy(() => import('./pages/Login'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Clients = lazy(() => import('./pages/Clients'));
const ClientDetail = lazy(() => import('./pages/ClientDetail'));
const DeliveryInspection = lazy(() => import('./pages/DeliveryInspection'));
const Deliveries = lazy(() => import('./pages/Deliveries'));
const Messages = lazy(() => import('./pages/Messages'));
const Templates = lazy(() => import('./pages/Templates'));
const MyClients = lazy(() => import('./pages/MyClients'));
const VirtualYardDeals = lazy(() => import('./pages/VirtualYardDeals'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminAudit = lazy(() => import('./pages/admin/AuditLog'));
const AdminShareLinks = lazy(() => import('./pages/admin/ShareLinks'));
const AdminImports = lazy(() => import('./pages/admin/Imports'));
const AdminOffers = lazy(() => import('./pages/admin/Offers'));
const AdminInboundQueue = lazy(() => import('./pages/admin/InboundQueue'));
const SharedDashboard = lazy(() => import('./pages/SharedDashboard'));
const UploadPortal = lazy(() => import('./pages/UploadPortal'));
import { Toaster } from './components/ui/sonner';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <SiteProvider>
            <Suspense fallback={<p role="status" className="p-6 text-sm text-neutral-500">Loading page…</p>}>
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
                <Route path="/clients/:id/inspection" element={<DeliveryInspection />} />
                <Route path="/my-clients" element={<MyClients />} />
                <Route path="/deliveries" element={<Deliveries />} />
                <Route path="/virtualyard-deals" element={<VirtualYardDeals />} />
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
            </Suspense>
          </SiteProvider>
        </AuthProvider>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
