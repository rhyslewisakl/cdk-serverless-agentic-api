import { lazy } from 'react';

// Lazy load pages for code splitting
export const DashboardPage = lazy(() => 
  import('../../pages/DashboardPage').then(module => ({ default: module.DashboardPage }))
);

export const ItemsPage = lazy(() => 
  import('../../pages/ItemsPage').then(module => ({ default: module.ItemsPage }))
);