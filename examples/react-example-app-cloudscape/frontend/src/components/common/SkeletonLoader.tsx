import React from 'react';
import { Box } from '@cloudscape-design/components';

interface SkeletonLoaderProps {
  rows?: number;
  height?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  rows = 3, 
  height = '20px' 
}) => {
  return (
    <>
      <style>
        {`
          @keyframes skeleton-loading {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
          .skeleton-item {
            height: ${height};
            background-color: #f1f1f1;
            border-radius: 4px;
            animation: skeleton-loading 1.5s infinite ease-in-out;
            margin-bottom: 8px;
          }
        `}
      </style>
      <Box>
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="skeleton-item"
            style={{ opacity: 1 - (index * 0.1) }}
          />
        ))}
      </Box>
    </>
  );
};