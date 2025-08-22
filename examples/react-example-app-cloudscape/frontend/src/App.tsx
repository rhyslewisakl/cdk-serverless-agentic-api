import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { configureAmplify } from './config/amplify';
import { useAppDispatch } from './hooks/redux';
import { checkAuthAsync } from './store/authSlice';
import { PrivateRoute } from './components/PrivateRoute';
import { ItemsPage } from './pages/ItemsPage';
import '@cloudscape-design/global-styles/index.css';

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await configureAmplify();
        dispatch(checkAuthAsync());
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, [dispatch]);

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
