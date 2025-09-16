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

// Shared Components
import LoadingScreen from './components/shared/LoadingScreen';
import ErrorBoundary from './components/shared/ErrorBoundary';
import DevPanel from './components/shared/DevPanel';

// Protected Route Component with Development Toggle
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useUser();

  // Skip authentication in development mode
  if (DEV_CONFIG.DISABLE_AUTH) {
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
    return <Navigate to="/dashboard" replace />;
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

          {/* Default Route */}
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
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
    <ErrorBoundary>
      <UserProvider>
        <AppRoutes />
      </UserProvider>
    </ErrorBoundary>
  );
}

export default App;