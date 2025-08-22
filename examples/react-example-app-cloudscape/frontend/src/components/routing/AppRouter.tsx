import React, { Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { DashboardPage, ItemsPage } from './LazyRoutes';

export const AppRouter: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner size="large" text="Loading page..." />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/items" element={<ItemsPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
};