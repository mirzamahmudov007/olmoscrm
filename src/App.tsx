import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { WorkspacesPage } from './pages/WorkspacesPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { ROUTES } from './config/constants';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 401) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen">
            <Routes>
              <Route path={ROUTES.LOGIN} element={<LoginPage />} />
              <Route
                path={ROUTES.WORKSPACES}
                element={
                  <ProtectedRoute>
                    <WorkspacesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.WORKSPACE}
                element={
                  <ProtectedRoute>
                    <WorkspacesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path={`${ROUTES.WORKSPACE}/:id`}
                element={
                  <ProtectedRoute>
                    <WorkspacePage />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to={ROUTES.WORKSPACES} replace />} />
            </Routes>
          </div>
          
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: 'bg-white border border-gray-200 text-gray-900 shadow-lg',
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;