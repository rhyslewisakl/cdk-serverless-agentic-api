import React from 'react';
import { useAppSelector } from '../hooks/redux';
import { AuthPage } from '../pages/AuthPage';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <>{children}</>;
};