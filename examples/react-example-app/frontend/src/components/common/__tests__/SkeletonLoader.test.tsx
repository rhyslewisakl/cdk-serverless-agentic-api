/**
 * Tests for SkeletonLoader component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SkeletonLoader, ItemListSkeleton, ItemCardSkeleton, FormSkeleton, TableSkeleton } from '../SkeletonLoader';

describe('SkeletonLoader', () => {
  it('renders custom skeleton with default props', () => {
    render(<SkeletonLoader />);
    
    const skeleton = screen.getByTestId('skeleton-loader');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders multiple skeletons when count is specified', () => {
    render(<SkeletonLoader count={3} />);
    
    const skeletons = screen.container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons).toHaveLength(3);
  });

  it('renders list variant correctly', () => {
    render(<SkeletonLoader variant="list" count={2} />);
    
    // Should have circular avatars and text skeletons
    const skeletons = screen.container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(2); // Multiple skeletons per list item
  });

  it('renders card variant correctly', () => {
    render(<SkeletonLoader variant="card" count={1} />);
    
    // Should render within a card
    const skeletons = screen.container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(1); // Multiple skeletons per card
  });

  it('renders form variant correctly', () => {
    render(<SkeletonLoader variant="form" count={3} />);
    
    const skeletons = screen.container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(3); // Labels + fields + buttons
  });

  it('renders table variant correctly', () => {
    render(<SkeletonLoader variant="table" count={3} />);
    
    const skeletons = screen.container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(3); // Header + rows
  });

  it('renders children with skeleton', () => {
    render(
      <SkeletonLoader>
        <div>Custom content</div>
      </SkeletonLoader>
    );
    
    expect(screen.getByText('Custom content')).toBeInTheDocument();
    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('applies custom width and height', () => {
    render(<SkeletonLoader width={200} height={100} />);
    
    const skeleton = screen.container.querySelector('.MuiSkeleton-root');
    expect(skeleton).toHaveStyle({
      width: '200px',
      height: '100px',
    });
  });

  it('applies animation prop', () => {
    render(<SkeletonLoader animation="pulse" />);
    
    const skeleton = screen.container.querySelector('.MuiSkeleton-root');
    expect(skeleton).toHaveClass('MuiSkeleton-pulse');
  });

  it('disables animation when set to false', () => {
    render(<SkeletonLoader animation={false} />);
    
    const skeleton = screen.container.querySelector('.MuiSkeleton-root');
    expect(skeleton).not.toHaveClass('MuiSkeleton-pulse');
    expect(skeleton).not.toHaveClass('MuiSkeleton-wave');
  });
});

describe('Specialized Skeleton Components', () => {
  it('renders ItemListSkeleton with default count', () => {
    render(<ItemListSkeleton />);
    
    const skeletons = screen.container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(5); // Default count is 5
  });

  it('renders ItemListSkeleton with custom count', () => {
    render(<ItemListSkeleton count={3} />);
    
    const skeletons = screen.container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(3);
  });

  it('renders ItemCardSkeleton with default count', () => {
    render(<ItemCardSkeleton />);
    
    const skeletons = screen.container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(3); // Default count is 3
  });

  it('renders FormSkeleton with default field count', () => {
    render(<FormSkeleton />);
    
    const skeletons = screen.container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(4); // Default fieldCount is 4
  });

  it('renders TableSkeleton with default row count', () => {
    render(<TableSkeleton />);
    
    const skeletons = screen.container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(5); // Default rowCount is 5
  });

  it('renders FormSkeleton with custom field count', () => {
    render(<FormSkeleton fieldCount={2} />);
    
    const skeletons = screen.container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(2);
  });

  it('renders TableSkeleton with custom row count', () => {
    render(<TableSkeleton rowCount={3} />);
    
    const skeletons = screen.container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(3);
  });
});