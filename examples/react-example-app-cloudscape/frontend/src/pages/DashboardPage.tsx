import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Header,
  SpaceBetween,
  Cards,
  Box,
  ColumnLayout,
  StatusIndicator,
  Button,
} from '@cloudscape-design/components';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchItemsAsync } from '../store/itemsSlice';
import { AppLayout } from '../components/layout/AppLayout';
import { SkeletonLoader } from '../components/common/SkeletonLoader';

export const DashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, isLoading } = useAppSelector((state) => state.items);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (items.length === 0) {
      dispatch(fetchItemsAsync());
    }
  }, [dispatch, items.length]);

  const safeItems = Array.isArray(items) ? items : [];
  
  const stats = {
    totalItems: safeItems.length,
    activeItems: safeItems.filter(item => item.status === 'active').length,
    inactiveItems: safeItems.filter(item => item.status === 'inactive').length,
    pendingItems: safeItems.filter(item => item.status === 'pending').length,
  };

  const recentItems = safeItems.slice(0, 5);

  return (
    <AppLayout 
      breadcrumbs={[{ text: 'Dashboard' }]}
    >
      <SpaceBetween direction="vertical" size="l">
        <Header variant="h1">
          Welcome back, {user?.email?.split('@')[0]}!
        </Header>

        <ColumnLayout 
          columns={4} 
          variant="text-grid"
        >
          <Container>
            <Box textAlign="center">
              <Box variant="h2" color="text-status-info">
                {stats.totalItems}
              </Box>
              <Box variant="small">Total Items</Box>
            </Box>
          </Container>
          
          <Container>
            <Box textAlign="center">
              <Box variant="h2" color="text-status-success">
                {stats.activeItems}
              </Box>
              <Box variant="small">Active</Box>
            </Box>
          </Container>
          
          <Container>
            <Box textAlign="center">
              <Box variant="h2" color="text-status-warning">
                {stats.pendingItems}
              </Box>
              <Box variant="small">Pending</Box>
            </Box>
          </Container>
          
          <Container>
            <Box textAlign="center">
              <Box variant="h2" color="text-status-error">
                {stats.inactiveItems}
              </Box>
              <Box variant="small">Inactive</Box>
            </Box>
          </Container>
        </ColumnLayout>

        <Container>
          <Header variant="h2">Recent Items</Header>
          {isLoading && items.length === 0 ? (
            <SkeletonLoader rows={3} height="120px" />
          ) : recentItems.length > 0 ? (
            <Cards
              cardDefinition={{
                header: item => item.title,
                sections: [
                  {
                    id: 'description',
                    content: item => item.description,
                  },
                  {
                    id: 'status',
                    content: item => (
                      <StatusIndicator 
                        type={
                          item.status === 'active' ? 'success' : 
                          item.status === 'pending' ? 'pending' : 'stopped'
                        }
                      >
                        {item.status}
                      </StatusIndicator>
                    ),
                  },
                ],
              }}
              cardsPerRow={[
                { cards: 1 },
                { minWidth: 400, cards: 2 },
                { minWidth: 600, cards: 2 },
                { minWidth: 900, cards: 3 },
              ]}
              items={recentItems}
              loading={isLoading}
              loadingText="Loading items"
              empty={
                <Box textAlign="center" color="inherit">
                  <b>No items</b>
                  <Box variant="p" color="inherit">
                    You don't have any items yet.
                  </Box>
                </Box>
              }
            />
          ) : (
            <Box textAlign="center" color="inherit">
              <SpaceBetween size="m">
                <b>No items yet</b>
                <Box variant="p" color="inherit">
                  Create your first item to get started.
                </Box>
                <Button 
                  variant="primary" 
                  onClick={() => navigate('/items')}
                >
                  Create Your First Item
                </Button>
              </SpaceBetween>
            </Box>
          )}
        </Container>
      </SpaceBetween>
    </AppLayout>
  );
};