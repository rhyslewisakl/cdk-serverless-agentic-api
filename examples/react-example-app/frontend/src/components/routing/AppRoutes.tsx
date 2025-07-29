/**
 * Application routing configuration with authentication guards
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

// Import components
import { AuthGuard } from '../auth/AuthGuard';
import { Navigation, Breadcrumbs } from '../common';
import {
  HomePage,
  LoginPage,
  RegisterPage,
  DashboardPage,
  NotFoundPage,
} from '../pages';
import ItemsPage from '../pages/ItemsPage';

/**
 * Main application routes with authentication guards
 */
export const AppRoutes: React.FC = () => {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navigation />
      <Breadcrumbs />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Routes>
          {/* Public routes - redirect to dashboard if authenticated */}
          <Route
            path="/"
            element={
              <AuthGuard requireAuth={false}>
                <HomePage />
              </AuthGuard>
            }
          />
          <Route
            path="/login"
            element={
              <AuthGuard requireAuth={false}>
                <LoginPage />
              </AuthGuard>
            }
          />
          <Route
            path="/register"
            element={
              <AuthGuard requireAuth={false}>
                <RegisterPage />
              </AuthGuard>
            }
          />

          {/* Protected routes - require authentication */}
          <Route
            path="/dashboard"
            element={
              <AuthGuard requireAuth={true}>
                <DashboardPage />
              </AuthGuard>
            }
          />

          {/* Placeholder routes for future implementation */}
          <Route
            path="/items"
            element={
              <AuthGuard requireAuth={true}>
                <ItemsPage />
              </AuthGuard>
            }
          />
          <Route
            path="/items/new"
            element={
              <AuthGuard requireAuth={true}>
                <PlaceholderPage title="Create Item" description="Item creation form will be implemented in task 5" />
              </AuthGuard>
            }
          />
          <Route
            path="/items/:id"
            element={
              <AuthGuard requireAuth={true}>
                <PlaceholderPage title="Edit Item" description="Item editing form will be implemented in task 5" />
              </AuthGuard>
            }
          />
          <Route
            path="/profile"
            element={
              <AuthGuard requireAuth={true}>
                <PlaceholderPage title="Profile" description="Profile management will be implemented in future tasks" />
              </AuthGuard>
            }
          />
          <Route
            path="/settings"
            element={
              <AuthGuard requireAuth={true}>
                <PlaceholderPage title="Settings" description="Application settings will be implemented in future tasks" />
              </AuthGuard>
            }
          />
          <Route
            path="/change-password"
            element={
              <AuthGuard requireAuth={true}>
                <PlaceholderPage title="Change Password" description="Password change functionality is available in the authentication components" />
              </AuthGuard>
            }
          />

          {/* Redirect /home to / */}
          <Route path="/home" element={<Navigate to="/" replace />} />

          {/* 404 Not Found - catch all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Box>
    </Box>
  );
};

/**
 * Placeholder component for routes not yet implemented
 */
interface PlaceholderPageProps {
  title: string;
  description: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        p: 4,
      }}
    >
      <Box
        sx={{
          p: 4,
          border: '2px dashed',
          borderColor: 'grey.300',
          borderRadius: 2,
          maxWidth: 500,
        }}
      >
        <Box
          component="h1"
          sx={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: 'text.primary',
            mb: 2,
          }}
        >
          {title}
        </Box>
        <Box
          component="p"
          sx={{
            fontSize: '1rem',
            color: 'text.secondary',
            mb: 0,
          }}
        >
          {description}
        </Box>
      </Box>
    </Box>
  );
};

export default AppRoutes;