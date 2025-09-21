import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Configuration
import DEV_CONFIG from './config/development';

// Context Providers
import { UserProvider, useUser } from './contexts/UserContext';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import AdminTicketTypeCreatePage from './pages/AdminTicketTypeCreatePage';
import AdminCustomFieldCreatePage from './pages/AdminCustomFieldCreatePage';

// Shared Components
import LoadingScreen from './components/shared/LoadingScreen';
import ErrorBoundary from './components/shared/ErrorBoundary';
import ErrorBoundary130, { useError130Detection } from './components/shared/ErrorBoundary130';
import DevPanel from './components/shared/DevPanel';

// Smart Redirect Component for Root Route
const SmartRedirect = () => {
  const { isAuthenticated, loading } = useUser();

  // Skip authentication check in development mode or when direct access is allowed
  if (DEV_CONFIG.DISABLE_AUTH || DEV_CONFIG.ALLOW_DIRECT_ACCESS) {
    return <Navigate to="/dashboard" replace />;
  }

  // Show loading while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  // Redirect based on authentication status
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  } else {
    return <Navigate to="/login" replace />;
  }
};

// Protected Route Component with Development Toggle
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useUser();

  // Skip authentication in development mode or when direct access is allowed
  if (DEV_CONFIG.DISABLE_AUTH || DEV_CONFIG.ALLOW_DIRECT_ACCESS) {
    return children;
  }

  // Original authentication logic for production
  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Public Route Component with Development Toggle
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useUser();

  // Skip authentication in development mode
  if (DEV_CONFIG.DISABLE_AUTH) {
    return children;
  }

  // Original authentication logic for production
  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// App Routes Component (needs to be inside UserProvider)
const AppRoutes = () => {
  // Global Error #130 detection hook
  useError130Detection();

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Sub-Pages */}
          <Route
            path="/admin/ticket-types/create"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminTicketTypeCreatePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/custom-fields/create"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminCustomFieldCreatePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/custom-fields/:id/edit"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminCustomFieldCreatePage />
              </ProtectedRoute>
            }
          />

          {/* Unauthorized Access Page */}
          <Route
            path="/unauthorized"
            element={<UnauthorizedPage />}
          />

          {/* Default Route - Smart Redirect */}
          <Route
            path="/"
            element={<SmartRedirect />}
          />

          {/* Catch-all route */}
          <Route
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />
        </Routes>

        {/* Development Panel */}
        <DevPanel />
      </div>
    </Router>
  );
};

// Main App Component
function App() {
  return (
    <ErrorBoundary130>
      <ErrorBoundary>
        <UserProvider>
          <AppRoutes />
        </UserProvider>
      </ErrorBoundary>
    </ErrorBoundary130>
  );
}

export default App;