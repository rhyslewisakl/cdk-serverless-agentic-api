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
      href: '#/dashboard',
    },
    {
      type: 'link' as const,
      text: 'Items',
      href: '#/items',
    },
  ];



  const sideNavigation = (
    <SideNavigation
      activeHref={`#${location.pathname}`}
      header={{ href: '#/', text: 'Navigation' }}
      items={navigationItems}
      onFollow={({ detail }) => {
        if (!detail.external) {
          const path = detail.href.replace('#', '');
          navigate(path);
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
      navigationWidth={280}
      onNavigationChange={({ detail }) => setNavigationOpen(detail.open)}
      breadcrumbs={
        breadcrumbItems.length > 1 ? (
          <BreadcrumbGroup items={breadcrumbItems} />
        ) : undefined
      }
      content={
        <Box padding={{ vertical: 'l', horizontal: 's' }}>
          <Box margin={{ bottom: 'l' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <Button 
                onClick={handleSignOut}
                variant="normal"
                iconName="user-profile"
              >
                Sign Out ({user?.email?.split('@')[0] || 'User'})
              </Button>
            </div>
          </Box>
          {children}
        </Box>
      }
      toolsHide
      maxContentWidth={1200}
    />
  );
};