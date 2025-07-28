/**
 * Breadcrumb navigation component for better user experience
 */

import React from 'react';
import {
  Breadcrumbs as MuiBreadcrumbs,
  Link,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Home,
  Dashboard,
  List,
  Add,
  Edit,
  Person,
  Settings,
  NavigateNext,
} from '@mui/icons-material';
import { useLocation, Link as RouterLink } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

/**
 * Breadcrumb navigation component that automatically generates breadcrumbs based on current route
 */
export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Generate breadcrumb items based on current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with home
    breadcrumbs.push({
      label: 'Home',
      path: '/',
      icon: <Home fontSize="small" />,
    });

    // Map path segments to breadcrumb items
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      switch (segment) {
        case 'dashboard':
          breadcrumbs.push({
            label: 'Dashboard',
            path: isLast ? undefined : currentPath,
            icon: <Dashboard fontSize="small" />,
          });
          break;
        case 'items':
          breadcrumbs.push({
            label: 'Items',
            path: isLast ? undefined : currentPath,
            icon: <List fontSize="small" />,
          });
          break;
        case 'new':
          breadcrumbs.push({
            label: 'Create New',
            path: isLast ? undefined : currentPath,
            icon: <Add fontSize="small" />,
          });
          break;
        case 'edit':
          breadcrumbs.push({
            label: 'Edit',
            path: isLast ? undefined : currentPath,
            icon: <Edit fontSize="small" />,
          });
          break;
        case 'profile':
          breadcrumbs.push({
            label: 'Profile',
            path: isLast ? undefined : currentPath,
            icon: <Person fontSize="small" />,
          });
          break;
        case 'settings':
          breadcrumbs.push({
            label: 'Settings',
            path: isLast ? undefined : currentPath,
            icon: <Settings fontSize="small" />,
          });
          break;
        case 'change-password':
          breadcrumbs.push({
            label: 'Change Password',
            path: isLast ? undefined : currentPath,
            icon: <Settings fontSize="small" />,
          });
          break;
        default:
          // Handle dynamic segments (like item IDs)
          if (segment.match(/^[a-f0-9-]{36}$/)) {
            // UUID pattern - likely an item ID
            breadcrumbs.push({
              label: 'Item Details',
              path: isLast ? undefined : currentPath,
              icon: <Edit fontSize="small" />,
            });
          } else {
            // Generic segment
            breadcrumbs.push({
              label: segment.charAt(0).toUpperCase() + segment.slice(1),
              path: isLast ? undefined : currentPath,
            });
          }
          break;
      }
    });

    return breadcrumbs;
  };

  const breadcrumbItems = generateBreadcrumbs();

  // Don't show breadcrumbs on home page or if only one item
  if (location.pathname === '/' || breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <Box
      sx={{
        py: 1,
        px: { xs: 2, sm: 3 },
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <MuiBreadcrumbs
        separator={<NavigateNext fontSize="small" />}
        aria-label="breadcrumb navigation"
        maxItems={isMobile ? 2 : 4}
        itemsAfterCollapse={isMobile ? 1 : 2}
        itemsBeforeCollapse={isMobile ? 1 : 2}
      >
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;

          if (isLast || !item.path) {
            // Current page - not clickable
            return (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: 'text.primary',
                }}
              >
                {!isMobile && item.icon}
                <Typography
                  variant="body2"
                  color="text.primary"
                  fontWeight="medium"
                >
                  {item.label}
                </Typography>
              </Box>
            );
          }

          // Clickable breadcrumb
          return (
            <Link
              key={index}
              component={RouterLink}
              to={item.path}
              underline="hover"
              color="inherit"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              {!isMobile && item.icon}
              <Typography variant="body2" color="inherit">
                {item.label}
              </Typography>
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
};

export default Breadcrumbs;