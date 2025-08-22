import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './hooks/redux';
import { initializeAppAsync } from './store/appSlice';
import { checkAuthAsync } from './store/authSlice';
import { PrivateRoute } from './components/PrivateRoute';
import { DashboardPage } from './pages/DashboardPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { NotificationProvider } from './components/common/NotificationProvider';
import { Spinner, Box } from '@cloudscape-design/components';
import '@cloudscape-design/global-styles/index.css';

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isInitialized, isInitializing } = useAppSelector((state) => state.app);

  useEffect(() => {
    const initialize = async () => {
      await dispatch(initializeAppAsync());
      dispatch(checkAuthAsync());
    };
    
    initialize();
  }, [dispatch]);

  if (!isInitialized || isInitializing) {
    return (
      <Box textAlign="center" padding="xxl">
        <Spinner size="large" />
      </Box>
    );
  }

  return (
    <>
      <PrivateRoute>
        <DashboardPage />
      </PrivateRoute>
      <NotificationProvider />
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <AppContent />
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
