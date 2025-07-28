/**
 * Skeleton loading component for better perceived performance
 */

import React from 'react';
import { Box, Skeleton, Card, CardContent, Stack } from '@mui/material';

interface SkeletonLoaderProps {
  variant?: 'list' | 'card' | 'form' | 'table' | 'custom';
  count?: number;
  height?: number | string;
  width?: number | string;
  animation?: 'pulse' | 'wave' | false;
  children?: React.ReactNode;
}

/**
 * Skeleton loader component with different variants for common UI patterns
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'custom',
  count = 1,
  height = 40,
  width = '100%',
  animation = 'wave',
  children,
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'list':
        return (
          <Stack spacing={2}>
            {Array.from({ length: count }).map((_, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="circular" width={40} height={40} animation={animation} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" height={20} animation={animation} />
                  <Skeleton variant="text" width="40%" height={16} animation={animation} />
                </Box>
                <Skeleton variant="rectangular" width={80} height={32} animation={animation} />
              </Box>
            ))}
          </Stack>
        );

      case 'card':
        return (
          <Stack spacing={2}>
            {Array.from({ length: count }).map((_, index) => (
              <Card key={index}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Skeleton variant="circular" width={48} height={48} animation={animation} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="70%" height={24} animation={animation} />
                      <Skeleton variant="text" width="50%" height={16} animation={animation} />
                    </Box>
                  </Box>
                  <Skeleton variant="rectangular" width="100%" height={120} animation={animation} sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Skeleton variant="rectangular" width={80} height={32} animation={animation} />
                    <Skeleton variant="rectangular" width={80} height={32} animation={animation} />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        );

      case 'form':
        return (
          <Stack spacing={3}>
            {Array.from({ length: count }).map((_, index) => (
              <Box key={index}>
                <Skeleton variant="text" width="30%" height={20} animation={animation} sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" width="100%" height={56} animation={animation} />
              </Box>
            ))}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
              <Skeleton variant="rectangular" width={100} height={36} animation={animation} />
              <Skeleton variant="rectangular" width={100} height={36} animation={animation} />
            </Box>
          </Stack>
        );

      case 'table':
        return (
          <Box>
            {/* Table header */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, pb: 1, borderBottom: '1px solid #e0e0e0' }}>
              {Array.from({ length: 4 }).map((_, colIndex) => (
                <Skeleton
                  key={colIndex}
                  variant="text"
                  width={colIndex === 0 ? '30%' : '20%'}
                  height={20}
                  animation={animation}
                />
              ))}
            </Box>
            {/* Table rows */}
            {Array.from({ length: count }).map((_, rowIndex) => (
              <Box key={rowIndex} sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
                {Array.from({ length: 4 }).map((_, colIndex) => (
                  <Skeleton
                    key={colIndex}
                    variant="text"
                    width={colIndex === 0 ? '30%' : '20%'}
                    height={16}
                    animation={animation}
                  />
                ))}
              </Box>
            ))}
          </Box>
        );

      case 'custom':
      default:
        return (
          <Stack spacing={1}>
            {Array.from({ length: count }).map((_, index) => (
              <Skeleton
                key={index}
                variant="rectangular"
                width={width}
                height={height}
                animation={animation}
              />
            ))}
          </Stack>
        );
    }
  };

  if (children) {
    return (
      <Box>
        {children}
        {renderSkeleton()}
      </Box>
    );
  }

  return <Box data-testid="skeleton-loader">{renderSkeleton()}</Box>;
};

/**
 * Specialized skeleton components for common use cases
 */

export const ItemListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <SkeletonLoader variant="list" count={count} />
);

export const ItemCardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <SkeletonLoader variant="card" count={count} />
);

export const FormSkeleton: React.FC<{ fieldCount?: number }> = ({ fieldCount = 4 }) => (
  <SkeletonLoader variant="form" count={fieldCount} />
);

export const TableSkeleton: React.FC<{ rowCount?: number }> = ({ rowCount = 5 }) => (
  <SkeletonLoader variant="table" count={rowCount} />
);

export default SkeletonLoader;