import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppLayout as CloudscapeAppLayout,
  SideNavigation,
  BreadcrumbGroup,
  Box,
  Button,
} from '@cloudscape-design/components';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { signOutAsync } from '../../store/authSlice';

interface AppLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: Array<{ text: string; href?: string }>;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  breadcrumbs = [] 
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const [navigationOpen, setNavigationOpen] = useState(false);
  


  const handleSignOut = () => {
    dispatch(signOutAsync());
  };

  const navigationItems = [
    {
      type: 'link' as const,
      text: 'Dashboard',
      href: '/dashboard',
    },
    {
      type: 'link' as const,
      text: 'Items',
      href: '/items',
    },
  ];



  const sideNavigation = (
    <SideNavigation
      activeHref={location.pathname}
      header={{ href: '#/', text: 'Navigation' }}
      items={navigationItems}
      onFollow={({ detail }) => {
        if (!detail.external) {
          navigate(detail.href);
        }
      }}
    />
  );

  const breadcrumbItems = [
    { text: 'Home', href: '#/' },
    ...breadcrumbs.map(b => ({ ...b, href: b.href || '#/' })),
  ];

  return (
    <CloudscapeAppLayout
      navigation={sideNavigation}
      navigationOpen={navigationOpen}
      onNavigationChange={({ detail }) => setNavigationOpen(detail.open)}
      breadcrumbs={
        breadcrumbItems.length > 1 ? (
          <BreadcrumbGroup items={breadcrumbItems} />
        ) : undefined
      }
      content={
        <Box padding="l">
          <Box float="right" margin={{ bottom: 'l' }}>
            <Button onClick={handleSignOut}>
              Sign Out ({user?.email?.split('@')[0] || 'User'})
            </Button>
          </Box>
          {children}
        </Box>
      }

      toolsHide
    />
  );
};