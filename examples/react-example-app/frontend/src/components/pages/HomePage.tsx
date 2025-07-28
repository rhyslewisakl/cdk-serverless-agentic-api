/**
 * Home page component for unauthenticated users
 */

import React from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Security,
  CloudQueue,
  Code,
  Speed,
  CheckCircle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/**
 * Home page component that introduces the application
 */
export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Security color="primary" />,
      title: 'Secure Authentication',
      description: 'AWS Cognito integration with secure user management'
    },
    {
      icon: <CloudQueue color="primary" />,
      title: 'Serverless Architecture',
      description: 'Built on AWS Lambda, API Gateway, and DynamoDB'
    },
    {
      icon: <Code color="primary" />,
      title: 'Modern React',
      description: 'React 18+ with TypeScript and Material-UI'
    },
    {
      icon: <Speed color="primary" />,
      title: 'High Performance',
      description: 'Optimized for speed with CloudFront CDN'
    }
  ];

  const capabilities = [
    'User registration and authentication',
    'Password management and reset',
    'CRUD operations on user data',
    'Responsive design for all devices',
    'Real-time error handling',
    'Comprehensive testing suite'
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 6 }}>
        {/* Hero section */}
        <Box textAlign="center" mb={6}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #1976d2 30%, #dc004e 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            React Example App
          </Typography>
          <Typography
            variant="h5"
            component="h2"
            color="text.secondary"
            paragraph
            sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}
          >
            A comprehensive demonstration of the cdk-serverless-agentic-api construct
            showcasing modern React development with AWS serverless architecture.
          </Typography>
          <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{ minWidth: 140 }}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/login')}
              sx={{ minWidth: 140 }}
            >
              Sign In
            </Button>
          </Box>
        </Box>

        {/* Features section */}
        <Box mb={6}>
          <Typography variant="h4" component="h3" textAlign="center" gutterBottom>
            Key Features
          </Typography>
          <Grid container spacing={4} sx={{ mt: 2 }}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    textAlign: 'center',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3,
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Box mb={2}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" component="h4" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Capabilities section */}
        <Box mb={6}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h4" component="h3" gutterBottom>
                What You Can Do
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                This example application demonstrates a complete user management
                and data manipulation system built with modern web technologies
                and AWS serverless services.
              </Typography>
              <List>
                {capabilities.map((capability, index) => (
                  <ListItem key={index} sx={{ pl: 0 }}>
                    <ListItemIcon>
                      <CheckCircle color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={capability} />
                  </ListItem>
                ))}
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>
                  Technology Stack
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  <strong>Frontend:</strong> React 18, TypeScript, Material-UI, React Router
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  <strong>Backend:</strong> AWS Lambda, API Gateway, DynamoDB
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  <strong>Authentication:</strong> AWS Cognito with Amplify
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Infrastructure:</strong> AWS CDK, CloudFront, S3
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Call to action */}
        <Box textAlign="center" py={4}>
          <Typography variant="h5" gutterBottom>
            Ready to explore?
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Sign up for a new account or sign in to start managing your data.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/register')}
          >
            Create Account
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default HomePage;