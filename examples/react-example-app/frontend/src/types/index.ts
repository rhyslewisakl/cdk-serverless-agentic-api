/**
 * Main types export file
 */

// API types
export * from './api';

// Authentication types
export * from './auth';

// User Item types
export * from './user-item';

// Common UI types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

// Route types
export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  requiresAuth: boolean;
  title?: string;
}