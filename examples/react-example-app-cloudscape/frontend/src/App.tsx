import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './hooks/redux';
import { initializeAppAsync } from './store/appSlice';
import { checkAuthAsync } from './store/authSlice';
import { PrivateRoute } from './components/PrivateRoute';
import { ItemsPage } from './pages/ItemsPage';
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
    <PrivateRoute>
      <ItemsPage />
    </PrivateRoute>
  );
};

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
