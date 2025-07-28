/**
 * Navigation component with authentication-aware menu
 */

import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  AccountCircle,
  Dashboard,
  Logout,
  Settings,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getErrorMessage } from '../../utils/helpers';

interface NavigationProps {
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
}

/**
 * Navigation component that adapts based on authentication state
 */
export const Navigation: React.FC<NavigationProps> = ({
  onMenuToggle,
  showMenuButton = false
}) => {
  const { authState, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      handleMenuClose();
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', getErrorMessage(error));
      // Even if logout fails, redirect to login
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleNavigation = (path: string) => {
    handleMenuClose();
    navigate(path);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        {/* Menu button for mobile/drawer toggle */}
        {showMenuButton && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={onMenuToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* App title */}
        <Typography
          variant="h6"
          component="div"
          sx={{ 
            flexGrow: 1, 
            cursor: 'pointer',
            '&:hover': { opacity: 0.8 }
          }}
          onClick={() => navigate(authState.isAuthenticated ? '/dashboard' : '/')}
        >
          React Example App
        </Typography>

        {/* Navigation items based on authentication state */}
        {authState.isAuthenticated ? (
          <Box display="flex" alignItems="center" gap={1}>
            {/* Dashboard button */}
            <Button
              color="inherit"
              onClick={() => navigate('/dashboard')}
              sx={{
                backgroundColor: isActive('/dashboard') ? 'rgba(255,255,255,0.1)' : 'transparent',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <Dashboard sx={{ mr: 1 }} />
              Dashboard
            </Button>

            {/* User menu */}
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="user-menu"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              color="inherit"
              disabled={isLoggingOut}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {authState.user?.email?.[0]?.toUpperCase() || <AccountCircle />}
              </Avatar>
            </IconButton>

            {/* User dropdown menu */}
            <Menu
              id="user-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              onClick={handleMenuClose}
              PaperProps={{
                elevation: 3,
                sx: {
                  mt: 1.5,
                  minWidth: 200,
                  '& .MuiAvatar-root': {
                    width: 24,
                    height: 24,
                    ml: -0.5,
                    mr: 1,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              {/* User info */}
              <MenuItem disabled>
                <ListItemIcon>
                  <Avatar sx={{ width: 24, height: 24, bgcolor: 'secondary.main' }}>
                    {authState.user?.email?.[0]?.toUpperCase()}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={authState.user?.email || 'User'}
                  secondary="Signed in"
                />
              </MenuItem>
              
              <Divider />

              {/* Dashboard */}
              <MenuItem onClick={() => handleNavigation('/dashboard')}>
                <ListItemIcon>
                  <Dashboard fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Dashboard" />
              </MenuItem>

              {/* Settings */}
              <MenuItem onClick={() => handleNavigation('/settings')}>
                <ListItemIcon>
                  <Settings fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Settings" />
              </MenuItem>

              <Divider />

              {/* Logout */}
              <MenuItem onClick={handleLogout} disabled={isLoggingOut}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={isLoggingOut ? 'Signing out...' : 'Sign out'} />
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Box display="flex" alignItems="center" gap={1}>
            {/* Login button */}
            <Button
              color="inherit"
              onClick={() => navigate('/login')}
              sx={{
                backgroundColor: isActive('/login') ? 'rgba(255,255,255,0.1)' : 'transparent',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Sign In
            </Button>

            {/* Register button */}
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => navigate('/register')}
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                backgroundColor: isActive('/register') ? 'rgba(255,255,255,0.1)' : 'transparent',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.8)',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Sign Up
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;