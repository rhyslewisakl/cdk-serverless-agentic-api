import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { configureAmplify } from './config/amplify';
import { useAppDispatch } from './hooks/redux';
import { checkAuthAsync } from './store/authSlice';
import { PrivateRoute } from './components/PrivateRoute';
import { ItemsPage } from './pages/ItemsPage';
import { Spinner, Box } from '@cloudscape-design/components';
import '@cloudscape-design/global-styles/index.css';

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await configureAmplify();
        dispatch(checkAuthAsync());
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsInitialized(true); // Still allow app to load even if config fails
      }
    };

    initializeApp();
  }, [dispatch]);

  if (!isInitialized) {
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
