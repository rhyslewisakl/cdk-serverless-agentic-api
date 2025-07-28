/**
 * Unit tests for Breadcrumbs component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Breadcrumbs } from '../Breadcrumbs';

const theme = createTheme();

// Test wrapper component
const TestWrapper: React.FC<{ 
  children: React.ReactNode; 
  initialEntries?: string[];
}> = ({ children, initialEntries = ['/'] }) => (
  <ThemeProvider theme={theme}>
    <MemoryRouter initialEntries={initialEntries}>
      {children}
    </MemoryRouter>
  </ThemeProvider>
);

describe('Breadcrumbs Component', () => {
  test('does not render on home page', () => {
    const { container } = render(
      <TestWrapper initialEntries={['/']}>
        <Breadcrumbs />
      </TestWrapper>
    );

    expect(container.firstChild).toBeNull();
  });

  test('renders breadcrumbs for dashboard page', () => {
    render(
      <TestWrapper initialEntries={['/dashboard']}>
        <Breadcrumbs />
      </TestWrapper>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('renders breadcrumbs for items page', () => {
    render(
      <TestWrapper initialEntries={['/items']}>
        <Breadcrumbs />
      </TestWrapper>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Items')).toBeInTheDocument();
  });

  test('renders breadcrumbs for nested routes', () => {
    render(
      <TestWrapper initialEntries={['/items/new']}>
        <Breadcrumbs />
      </TestWrapper>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Items')).toBeInTheDocument();
    expect(screen.getByText('Create New')).toBeInTheDocument();
  });

  test('renders breadcrumbs for profile page', () => {
    render(
      <TestWrapper initialEntries={['/profile']}>
        <Breadcrumbs />
      </TestWrapper>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  test('renders breadcrumbs for settings page', () => {
    render(
      <TestWrapper initialEntries={['/settings']}>
        <Breadcrumbs />
      </TestWrapper>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  test('renders breadcrumbs for change password page', () => {
    render(
      <TestWrapper initialEntries={['/change-password']}>
        <Breadcrumbs />
      </TestWrapper>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Change Password')).toBeInTheDocument();
  });

  test('handles UUID segments as item details', () => {
    const uuid = '123e4567-e89b-12d3-a456-426614174000';
    render(
      <TestWrapper initialEntries={[`/items/${uuid}`]}>
        <Breadcrumbs />
      </TestWrapper>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Items')).toBeInTheDocument();
    expect(screen.getByText('Item Details')).toBeInTheDocument();
  });

  test('handles generic segments with capitalization', () => {
    render(
      <TestWrapper initialEntries={['/custom-page']}>
        <Breadcrumbs />
      </TestWrapper>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Custom-page')).toBeInTheDocument();
  });

  test('home link is clickable', () => {
    render(
      <TestWrapper initialEntries={['/dashboard']}>
        <Breadcrumbs />
      </TestWrapper>
    );

    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveAttribute('href', '/');
  });

  test('intermediate links are clickable', () => {
    render(
      <TestWrapper initialEntries={['/items/new']}>
        <Breadcrumbs />
      </TestWrapper>
    );

    const homeLink = screen.getByText('Home').closest('a');
    const itemsLink = screen.getByText('Items').closest('a');
    
    expect(homeLink).toHaveAttribute('href', '/');
    expect(itemsLink).toHaveAttribute('href', '/items');
  });

  test('current page is not clickable', () => {
    render(
      <TestWrapper initialEntries={['/dashboard']}>
        <Breadcrumbs />
      </TestWrapper>
    );

    const dashboardText = screen.getByText('Dashboard');
    expect(dashboardText.closest('a')).toBeNull();
  });

  test('renders with proper ARIA label', () => {
    render(
      <TestWrapper initialEntries={['/dashboard']}>
        <Breadcrumbs />
      </TestWrapper>
    );

    expect(screen.getByLabelText('breadcrumb navigation')).toBeInTheDocument();
  });

  test('does not render when only one breadcrumb item', () => {
    // This would be the case for routes that don't generate meaningful breadcrumbs
    const { container } = render(
      <TestWrapper initialEntries={['/']}>
        <Breadcrumbs />
      </TestWrapper>
    );

    expect(container.firstChild).toBeNull();
  });
});