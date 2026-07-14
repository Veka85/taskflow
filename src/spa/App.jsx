import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage         from './pages/auth/LoginPage';
import RegisterPage      from './pages/auth/RegisterPage';
import DashboardPage     from './pages/DashboardPage';
import BoardPage         from './pages/BoardPage';
import BoardSettingsPage from './pages/BoardSettingsPage';
import ProfilePage       from './pages/ProfilePage';
import AdminPage         from './pages/admin/AdminPage';
import UsersPage         from './pages/admin/UsersPage';

import { PageSpinner } from './components/common/Spinner';

// CONCEPT — Route Guards (Protected Routes):
// These are wrapper components that check auth state before rendering children.
//
// ProtectedRoute: Redirects to /login if not authenticated
// AdminRoute:     Redirects to /dashboard if user is not admin
// GuestRoute:     Redirects to /dashboard if already logged in

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // CONCEPT — loading state:
  // On first load, we verify the stored token via API.
  // While that's in-flight, show a spinner to avoid redirecting prematurely.
  if (loading) return <PageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

// CONCEPT — React Router:
// BrowserRouter enables clean URL routing (no # in URLs).
// Routes matches the current URL against Route children.
// Navigate performs programmatic redirects.

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public (guest-only) routes */}
      <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* Authenticated routes */}
      <Route path="/dashboard"          element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/boards/:id"         element={<ProtectedRoute><BoardPage /></ProtectedRoute>} />
      <Route path="/boards/:id/settings" element={<ProtectedRoute><BoardSettingsPage /></ProtectedRoute>} />
      <Route path="/profile"            element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      {/* Admin-only routes */}
      <Route path="/admin"       element={<AdminRoute><AdminPage /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><UsersPage /></AdminRoute>} />

      {/* 404 fallback */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-6xl mb-4">🤷</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h1>
            <Link to="/dashboard" className="text-blue-600 hover:underline">← Go to Dashboard</Link>
          </div>
        </div>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
