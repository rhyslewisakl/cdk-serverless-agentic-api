/**
 * Dashboard page component for authenticated users
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  Chip,
  Paper,
  Skeleton,
  useTheme,
  useMediaQuery,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Dashboard,
  Add,
  List,
  Person,
  Settings,
  TrendingUp,
  Storage,
  Security,
  Refresh,
  Info,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardStats {
  totalItems: number;
  activeItems: number;
  lastActivity: string;
  storageUsed: string;
}

/**
 * Enhanced dashboard page component for authenticated users with responsive design
 */
export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { authState } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Simulate loading dashboard stats
  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalItems: 12,
        activeItems: 8,
        lastActivity: new Date().toLocaleDateString(),
        storageUsed: '2.4 MB',
      });
      setIsLoading(false);
    };

    loadStats();
  }, [lastRefresh]);

  const handleRefresh = () => {
    setLastRefresh(new Date());
  };

  const quickActions = [
    {
      title: 'Create Item',
      description: 'Add a new item to your collection',
      icon: <Add />,
      action: () => navigate('/items/new'),
      color: 'primary' as const,
    },
    {
      title: 'View Items',
      description: 'Browse and manage your items',
      icon: <List />,
      action: () => navigate('/items'),
      color: 'secondary' as const,
    },
    {
      title: 'Profile Settings',
      description: 'Update your account settings',
      icon: <Person />,
      action: () => navigate('/profile'),
      color: 'info' as const,
    },
    {
      title: 'App Settings',
      description: 'Configure application preferences',
      icon: <Settings />,
      action: () => navigate('/settings'),
      color: 'warning' as const,
    },
  ];

  const statCards = [
    {
      title: 'Total Items',
      value: stats?.totalItems || 0,
      icon: <Storage color="primary" />,
      color: 'primary' as const,
    },
    {
      title: 'Active Items',
      value: stats?.activeItems || 0,
      icon: <TrendingUp color="success" />,
      color: 'success' as const,
    },
    {
      title: 'Last Activity',
      value: stats?.lastActivity || '-',
      icon: <Info color="info" />,
      color: 'info' as const,
    },
    {
      title: 'Storage Used',
      value: stats?.storageUsed || '-',
      icon: <Security color="warning" />,
      color: 'warning' as const,
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header section with responsive design */}
      <Box mb={4}>
        <Box 
          display="flex" 
          alignItems="center" 
          justifyContent="space-between"
          flexDirection={{ xs: 'column', sm: 'row' }}
          gap={2}
          mb={2}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Dashboard color="primary" sx={{ fontSize: { xs: 28, sm: 32 } }} />
            <Typography variant={isMobile ? "h5" : "h4"} component="h1">
              Dashboard
            </Typography>
          </Box>
          <Tooltip title="Refresh dashboard data">
            <span>
              <IconButton 
                onClick={handleRefresh}
                disabled={isLoading}
                color="primary"
              >
                <Refresh />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        
        <Typography 
          variant={isMobile ? "body1" : "h6"} 
          color="text.secondary" 
          gutterBottom
        >
          Welcome back, {authState.user?.email || 'User'}!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your items and account settings from this central hub.
        </Typography>
      </Box>

      {/* Status alert */}
      <Alert 
        severity="info" 
        sx={{ 
          mb: 4,
          '& .MuiAlert-message': {
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }
        }}
      >
        <Typography variant="body2">
          This is a demonstration application showcasing the cdk-serverless-agentic-api construct.
          All data is stored securely in your personal DynamoDB partition.
        </Typography>
      </Alert>

      {/* Statistics cards */}
      <Box mb={4}>
        <Typography variant="h5" component="h2" gutterBottom>
          Overview
        </Typography>
        <Grid container spacing={3}>
          {statCards.map((stat, index) => (
            <Grid item xs={6} sm={6} md={3} key={index}>
              <Paper
                elevation={2}
                sx={{
                  p: { xs: 2, sm: 3 },
                  textAlign: 'center',
                  height: '100%',
                  transition: 'all 0.2s',
                  '&:hover': {
                    elevation: 4,
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <Skeleton variant="circular" width={40} height={40} sx={{ mx: 'auto', mb: 1 }} data-testid="skeleton" />
                    <Skeleton variant="text" width="60%" sx={{ mx: 'auto', mb: 1 }} data-testid="skeleton" />
                    <Skeleton variant="text" width="40%" sx={{ mx: 'auto' }} data-testid="skeleton" />
                  </>
                ) : (
                  <>
                    <Box sx={{ mb: 1 }}>
                      {stat.icon}
                    </Box>
                    <Typography 
                      variant={isMobile ? "h6" : "h5"} 
                      component="div" 
                      fontWeight="bold"
                      color={`${stat.color}.main`}
                    >
                      {stat.value}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      fontSize={{ xs: '0.75rem', sm: '0.875rem' }}
                    >
                      {stat.title}
                    </Typography>
                  </>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Quick actions */}
      <Box mb={4}>
        <Typography variant="h5" component="h2" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={3}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={6} lg={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  }
                }}
                onClick={action.action}
              >
                <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      p: { xs: 1.5, sm: 2 },
                      borderRadius: '50%',
                      bgcolor: `${action.color}.light`,
                      color: `${action.color}.contrastText`,
                      mb: 2,
                    }}
                  >
                    {action.icon}
                  </Box>
                  <Typography 
                    variant={isMobile ? "subtitle1" : "h6"} 
                    component="h3" 
                    gutterBottom
                  >
                    {action.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    fontSize={{ xs: '0.75rem', sm: '0.875rem' }}
                  >
                    {action.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Account status with responsive layout */}
      <Box>
        <Typography variant="h5" component="h2" gutterBottom>
          Account Status
        </Typography>
        <Card>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Account Information
                </Typography>
                <Box display="flex" flexDirection="column" gap={1.5}>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography variant="body2" color="text.secondary" minWidth="60px">
                      Email:
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{ 
                        wordBreak: 'break-word',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      {authState.user?.email || 'Not available'}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" color="text.secondary" minWidth="60px">
                      Status:
                    </Typography>
                    <Chip
                      label="Active"
                      color="success"
                      size="small"
                    />
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" color="text.secondary" minWidth="60px">
                      Auth:
                    </Typography>
                    <Chip
                      label="Verified"
                      color="primary"
                      size="small"
                    />
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Security Actions
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/change-password')}
                    fullWidth
                    size={isMobile ? "small" : "medium"}
                  >
                    Change Password
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/profile')}
                    fullWidth
                    size={isMobile ? "small" : "medium"}
                  >
                    Update Profile
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default DashboardPage;