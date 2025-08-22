import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  header?: string;
  content: string;
  dismissible?: boolean;
  autoDismiss?: boolean;
}

interface NotificationState {
  notifications: Notification[];
}

const initialState: NotificationState = {
  notifications: [],
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        dismissible: action.payload.dismissible ?? true,
        autoDismiss: action.payload.autoDismiss ?? true,
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const { addNotification, removeNotification, clearNotifications } = notificationSlice.actions;

// Helper action creators
export const showSuccess = (content: string, header?: string) =>
  addNotification({ type: 'success', content, ...(header && { header }) });

export const showError = (content: string, header?: string) =>
  addNotification({ type: 'error', content, autoDismiss: false, ...(header && { header }) });

export const showWarning = (content: string, header?: string) =>
  addNotification({ type: 'warning', content, ...(header && { header }) });

export const showInfo = (content: string, header?: string) =>
  addNotification({ type: 'info', content, ...(header && { header }) });

export default notificationSlice.reducer;