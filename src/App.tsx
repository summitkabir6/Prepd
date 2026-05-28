import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';

// Pages
import Login from '@/pages/Login';
import Invite from '@/pages/Invite';

// Lawyer pages
import Dashboard from '@/pages/lawyer/Dashboard';
import NewCase from '@/pages/lawyer/NewCase';
import CaseDetail from '@/pages/lawyer/CaseDetail';
import ReportPage from '@/pages/lawyer/ReportPage';

// Client pages
import Prepare from '@/pages/client/Prepare';
import CaseView from '@/pages/client/CaseView';
import Session from '@/pages/client/Session';
import Complete from '@/pages/client/Complete';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'lawyer') return <Navigate to="/dashboard" replace />;
  return <Navigate to="/prepare" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/invite/:token" element={<Invite />} />

        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Lawyer routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="lawyer">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cases/new"
          element={
            <ProtectedRoute requiredRole="lawyer">
              <NewCase />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cases/:caseId"
          element={
            <ProtectedRoute requiredRole="lawyer">
              <CaseDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cases/:caseId/clients/:clientId/report/:reportId"
          element={
            <ProtectedRoute requiredRole="lawyer">
              <ReportPage />
            </ProtectedRoute>
          }
        />

        {/* Client routes */}
        <Route
          path="/prepare"
          element={
            <ProtectedRoute requiredRole="client">
              <Prepare />
            </ProtectedRoute>
          }
        />
        <Route
          path="/prepare/case/:caseId"
          element={
            <ProtectedRoute requiredRole="client">
              <CaseView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/prepare/session/:questionSetId"
          element={
            <ProtectedRoute requiredRole="client">
              <Session />
            </ProtectedRoute>
          }
        />
        <Route
          path="/prepare/complete"
          element={
            <ProtectedRoute requiredRole="client">
              <Complete />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
